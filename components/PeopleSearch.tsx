'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import { Search } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { cn } from '@/lib/utils';

interface Entry {
  login: string;
  name: string;
  avatarUrl: string;
  cohorts: string[];
  /** In the cohort that's still running; /people.json lists these first */
  current: boolean;
}

/** The platform never changes while the page is open, so there's nothing to subscribe to. */
const noSubscribe = () => () => {};

/** How many people to mount at once. The index itself stays in memory. */
const PAGE_SIZE = 20;

/** Find a person by name or GitHub username and open their page (/u/<login>). */
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
        <span className='hidden xl:inline'>Find yourself</span>
        <span className='sr-only xl:hidden'>Find yourself</span>
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
        title='Find a person'
        description='Search by name or GitHub username'
      >
        {/* This CommandDialog doesn't add a cmdk root itself; input and list need one. */}
        {/* Filtering is ours, so cmdk never mounts the people who aren't on this page. */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Name or GitHub username…'
            value={query}
            onValueChange={(value) => {
              // A new query starts back at the first page.
              setQuery(value);
              setPage(1);
            }}
          />
          <CommandList ref={listRef}>
            {(!people || filtered.length === 0) && (
              <CommandEmpty>{people ? 'No one found.' : 'Loading…'}</CommandEmpty>
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
                    <div className='flex min-w-0 flex-col'>
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
    </>
  );
}
