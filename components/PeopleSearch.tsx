'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
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
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<Entry[] | null>(null);
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
        onOpenChange={setOpen}
        title='Find a person'
        description='Search by name or GitHub username'
      >
        {/* This CommandDialog doesn't add a cmdk root itself; input and list need one. */}
        <Command>
          <CommandInput placeholder='Name or GitHub username…' />
          <CommandList>
            <CommandEmpty>{people ? 'No one found.' : 'Loading…'}</CommandEmpty>
            {people &&
              [
                { heading: 'Current cohort', list: people.filter((p) => p.current) },
                { heading: 'Earlier cohorts', list: people.filter((p) => !p.current) },
              ]
                .filter((g) => g.list.length > 0)
                .map((g) => (
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
                              <span className='ml-1.5 text-muted-foreground'>
                                @{p.login}
                              </span>
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
        </Command>
      </CommandDialog>
    </>
  );
}
