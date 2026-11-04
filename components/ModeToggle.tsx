'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button variant='outline' size='icon' onClick={toggleTheme} className={cn(className)}>
      <Sun
        className='rotate-0 scale-100 transition-all duration-500 dark:-rotate-90
          dark:scale-0 dark:translate-x-full'
      />
      <Moon
        className='absolute rotate-90 scale-0 transition-all -translate-x-full
          duration-500 dark:rotate-0 dark:scale-100 dark:translate-x-0'
      />
      <span className='sr-only'>Toggle theme</span>
    </Button>
  );
}
