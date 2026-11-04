'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface Entry {
  login: string;
  name: string;
  cohorts: string[];
}

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
        <kbd className='ml-1 hidden font-mono text-[10px] xl:inline'>⌘K</kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title='Find a person'
        description='Search by name or GitHub username'
      >
        <CommandInput placeholder='Name or GitHub username…' />
        <CommandList>
          <CommandEmpty>{people ? 'No one found.' : 'Loading…'}</CommandEmpty>
          {people && (
            <CommandGroup heading='People'>
              {people.map((p) => (
                <CommandItem
                  key={p.login}
                  value={`${p.name} ${p.login}`}
                  onSelect={() => {
                    setOpen(false);
                    router.push(`/u/${p.login}`);
                  }}
                >
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
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
