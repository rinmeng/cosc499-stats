'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import { ChevronDown, Search, Share2, Users } from 'lucide-react';

import { ShareDialog } from '@/components/ShareDialog';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import type { ShareItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Entry {
  login: string;
  name: string;
  avatarUrl: string;
  cohorts: string[];
  /** In the cohort that's still running; /people.json lists these first */
  current: boolean;
  description: string;
}

interface TeamEntry {
  name: string;
  cohort: string;
  current: boolean;
  description: string;
  path: string;
  members: { name: string; avatarUrl: string }[];
  memberCount: number;
}

/** The platform never changes while the page is open, so there's nothing to subscribe to. */
const noSubscribe = () => () => {};

/** How many people to mount at once. The index itself stays in memory. */
const PAGE_SIZE = 20;

/** How many team matches to show next to the people while searching. */
const TEAM_LIMIT = 6;

/**
 * Find a person (/u/<login>) or a team by name and open their page, or share it.
 * Sharing opens a preview of the text message the link becomes.
 */
export function PeopleSearch({
  className,
  onOpen,
}: {
  className?: string;
  /** Called when the dialog opens (e.g. to close the mobile menu) */
  onOpen?: () => void;
}) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<Entry[] | null>(null);
  const [teams, setTeams] = useState<TeamEntry[]>([]);
  const [sharing, setSharing] = useState<ShareItem | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  // The current cohort's team list is a drop-down while the search box is empty.
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  // "⌘" on Apple devices, "Ctrl" elsewhere. The server renders "⌘"; the client corrects it.
  const modKey = useSyncExternalStore(
    noSubscribe,
    () => (/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? '⌘' : 'Ctrl'),
    () => '⌘'
  );

  // ⌘K / Ctrl+K opens search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Load the index the first time search opens.
  useEffect(() => {
    if (!open || people) return;
    fetch('/people.json')
      .then((r) => r.json())
      .then(setPeople)
      .catch(() => setPeople([]));
    fetch('/teams.json')
      .then((r) => r.json())
      .then(setTeams)
      .catch(() => setTeams([]));
  }, [open, people]);

  useEffect(() => {
    listRef.current?.scrollTo(0, 0);
  }, [page, query]);

  const fuse = useMemo(
    () =>
      people
        ? new Fuse(people, {
            keys: ['name', 'login'],
            threshold: 0.4,
            ignoreLocation: true,
          })
        : null,
    [people]
  );

  const teamFuse = useMemo(
    () =>
      new Fuse(teams, {
        keys: ['name', 'cohort'],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [teams]
  );

  const filtered = useMemo(() => {
    if (!people) return [];
    const q = query.trim();
    if (!q || !fuse) return people;
    return fuse.search(q).map((result) => result.item);
  }, [people, query, fuse]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const searching = query.trim().length > 0;
  const q = query.trim();
  // Search shows the best few matches; the idle list shows every current-cohort team.
  const teamMatches = searching
    ? teamFuse
        .search(q)
        .map((r) => r.item)
        .slice(0, TEAM_LIMIT)
    : teams.filter((t) => t.current);
  const share = (item: ShareItem) => {
    setOpen(false);
    setQuery('');
    setPage(1);
    setSharing(item);
    setShareOpen(true);
  };
  const groups = searching
    ? [{ heading: 'Matches', list: visible }]
    : [
        { heading: 'Current cohort', list: visible.filter((p) => p.current) },
        { heading: 'Earlier cohorts', list: visible.filter((p) => !p.current) },
      ].filter((g) => g.list.length > 0);

  return (
    <>
      <Button
        variant='outline'
        size='sm'
        className={cn('gap-2 text-muted-foreground', className)}
        onClick={() => {
          onOpen?.();
          setOpen(true);
        }}
      >
        <Search className='size-4' />
        <span className='hidden xl:inline'>Find yourself or team</span>
        <span className='sr-only xl:hidden'>Find yourself or team</span>
        <KbdGroup className='ml-1 hidden xl:inline-flex'>
          <Kbd>{modKey}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setQuery('');
            setPage(1);
          }
        }}
        title='Find yourself or team'
        description='Search by name, GitHub username or team name'
      >
        {/* This CommandDialog doesn't add a cmdk root itself; input and list need one. */}
        {/* Filtering is ours, so cmdk never mounts the people who aren't on this page. */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Name, GitHub username or team…'
            value={query}
            onValueChange={(value) => {
              // A new query starts back at the first page.
              setQuery(value);
              setPage(1);
            }}
          />
          <CommandList ref={listRef}>
            {(!people || (filtered.length === 0 && teamMatches.length === 0)) && (
              <CommandEmpty>{people ? 'No one found.' : 'Loading…'}</CommandEmpty>
            )}
            {teamMatches.length > 0 && (
              <CommandGroup
                heading={
                  searching ? (
                    'Teams'
                  ) : (
                    <button
                      type='button'
                      aria-expanded={teamsOpen}
                      onClick={() => setTeamsOpen((o) => !o)}
                      className='-mx-1 flex w-[calc(100%+0.5rem)] items-center
                        justify-between rounded-md px-1 py-0.5 text-left
                        hover:text-foreground'
                    >
                      Teams in the current cohort ({teamMatches.length})
                      <ChevronDown
                        className={cn(
                          'size-4 transition-transform',
                          teamsOpen && 'rotate-180'
                        )}
                      />
                    </button>
                  )
                }
              >
                {(searching || teamsOpen) &&
                  teamMatches.map((t) => (
                    <CommandItem
                      key={t.path}
                      value={`team ${t.name} ${t.cohort}`}
                      onSelect={() => {
                        setOpen(false);
                        router.push(t.path);
                      }}
                    >
                      <div className='flex min-w-0 flex-1 flex-col'>
                        <div className='flex min-w-0 items-center gap-2'>
                          <span className='truncate'>{t.name}</span>
                          <AvatarGroup className='shrink-0'>
                            {t.members.map((m) => (
                              <Avatar key={m.avatarUrl} size='sm'>
                                <AvatarImage src={m.avatarUrl} alt='' loading='lazy' />
                                <AvatarFallback className='text-[9px]'>
                                  {m.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {t.memberCount > t.members.length && (
                              <AvatarGroupCount className='text-[10px]'>
                                +{t.memberCount - t.members.length}
                              </AvatarGroupCount>
                            )}
                            {t.members.length === 0 && (
                              <AvatarGroupCount>
                                <Users />
                              </AvatarGroupCount>
                            )}
                          </AvatarGroup>
                        </div>
                        <span className='truncate text-xs text-muted-foreground'>
                          {t.cohort}
                        </span>
                      </div>
                      <ShareRowButton
                        label={`Share ${t.name}`}
                        onClick={() =>
                          share({
                            path: t.path,
                            title: `${t.name} · ${t.cohort}`,
                            description: t.description,
                          })
                        }
                      />
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
            {groups.map((g) => (
              <CommandGroup key={g.heading} heading={g.heading}>
                {g.list.map((p) => (
                  <CommandItem
                    key={p.login}
                    value={`${p.name} ${p.login}`}
                    onSelect={() => {
                      setOpen(false);
                      router.push(`/u/${p.login}`);
                    }}
                  >
                    <Avatar className='size-7'>
                      <AvatarImage src={p.avatarUrl} alt='' loading='lazy' />
                      <AvatarFallback className='text-[10px]'>
                        {p.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex min-w-0 flex-1 flex-col'>
                      <span className='truncate'>
                        {p.name}
                        {p.name.toLowerCase() !== p.login.toLowerCase() && (
                          <span className='ml-1.5 text-muted-foreground'>@{p.login}</span>
                        )}
                      </span>
                      <span className='truncate text-xs text-muted-foreground'>
                        {p.cohorts.join(', ')}
                      </span>
                    </div>
                    <ShareRowButton
                      label={`Share ${p.name}`}
                      onClick={() =>
                        share({
                          path: `/u/${p.login}`,
                          title: p.name,
                          description: p.description,
                        })
                      }
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
          {people && filtered.length > PAGE_SIZE && (
            <div className='flex items-center justify-between gap-2 border-t px-3 py-2'>
              <span className='text-xs text-muted-foreground'>
                {start + 1}–{start + visible.length} of {filtered.length}
              </span>
              <div className='flex gap-1'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Command>
      </CommandDialog>
      <ShareDialog item={sharing} open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}

/** Small share icon at the end of a search row; doesn't open the row's page. */
function ShareRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type='button'
      variant='outline'
      size='icon-sm'
      className='shrink-0'
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Share2 className='size-3.5' />
    </Button>
  );
}
