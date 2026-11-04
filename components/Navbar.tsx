'use client';

import { LogIn, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Dialog,
  DialogTrigger,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui';
import { ModeToggle } from './ModeToggle';
import { Logo } from './Logo';
import { signOut, useAuth } from '@/hooks/use-auth';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { AUTH_ENABLED } from '@/config/auth';
import { useToast } from '@/hooks/use-toast';

function LoginButton({ onClose }: { onClose?: () => void }) {
  return (
    <Button
      variant='outline'
      nativeButton={false}
      render={<Link href='/login' onClick={onClose} />}
    >
      <LogIn /> Login
    </Button>
  );
}

function LogoutButton({ user, onClose }: { user: User; onClose?: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('You have been logged out.');
    } catch {
      toast.error('There was an issue logging you out.');
    }
    setDialogOpen(false);
    onClose?.();
    router.push('/login');
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger render={<Button variant='outline' />}>
        {user.email?.split('@')[0]} <LogOut />
      </DialogTrigger>
      <DialogContent className='sm:max-w-106.25'>
        <DialogHeader>
          <DialogTitle>Logout?</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you sure you want to logout from your account <strong>{user.email}</strong>?
        </DialogDescription>
        <DialogFooter>
          <Button variant='destructive' onClick={handleLogout}>
            Logout <LogOut />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/tech-stack', label: 'Tech Stack' },
  { href: '/admin', label: 'Admin' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const filteredNavLinks = AUTH_ENABLED
    ? navLinks.filter((link) => link.href !== '/admin' || user)
    : navLinks.filter((link) => link.href !== '/admin');

  return (
    <nav className='fixed z-50 w-full border-b bg-background'>
      <div
        className='mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6
          lg:px-8'
      >
        {/* Logo */}
        <Logo onClick={() => setOpen(false)} />

        {/* Desktop Navigation */}
        <div className='hidden items-center gap-4 md:flex'>
          {filteredNavLinks.map((link) => (
            <Button
              key={link.href}
              variant='ghost'
              nativeButton={false}
              render={<Link href={link.href} />}
            >
              {link.label}
            </Button>
          ))}
          {AUTH_ENABLED && (user ? <LogoutButton user={user} /> : <LoginButton />)}
          <ModeToggle />
        </div>

        {/* Mobile Navigation - Sheet */}
        <div className='md:hidden'>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant='outline' size='icon' />}>
              <Menu className='h-6 w-6' />
              <span className='sr-only'>Toggle menu</span>
            </SheetTrigger>
            <SheetContent side='right' className='w-75 sm:w-100'>
              <SheetHeader className='pr-12'>
                <SheetTitle>
                  <Logo onClick={() => setOpen(false)} />
                </SheetTitle>
              </SheetHeader>
              <div className='flex flex-col gap-6'>
                <nav className='flex flex-col gap-4 justify-center items-center'>
                  {filteredNavLinks.map((link) => (
                    <Button
                      key={link.href}
                      variant='ghost'
                      className='w-1/2'
                      nativeButton={false}
                      render={<Link href={link.href} onClick={() => setOpen(false)} />}
                    >
                      {link.label}
                    </Button>
                  ))}
                  {AUTH_ENABLED &&
                    (user ? (
                      <LogoutButton user={user} onClose={() => setOpen(false)} />
                    ) : (
                      <LoginButton onClose={() => setOpen(false)} />
                    ))}
                  <ModeToggle />
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
