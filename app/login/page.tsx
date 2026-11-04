'use client';

import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Spinner,
} from '@/components/ui';

import { signInWithEmail } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';

const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const { error } = await signInWithEmail(data.email, data.password);
      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          form.setError('email', { message: error.message });
        } else {
          form.setError('password', { message: error.message });
        }
        toast.error('Login failed', {
          description: 'Please check your credentials and try again.',
        });
      } else {
        toast.success('Login successful', { description: 'You are now signed in.' });
        router.push('/admin');
      }
    } catch (err) {
      toast.error('Login failed', { description: 'Unexpected error occurred.' });
      throw err;
    }
    setLoading(false);
  };

  return (
    <div className='flex min-h-screen'>
      {/* Left Side - Logo */}
      <div
        className='hidden lg:flex lg:w-1/2 bg-primary/5 items-center justify-center p-12
          fade-in-from-left-full'
      >
        <div className='text-center space-y-6'>
          <Logo iconSize={40} className='text-4xl fade-in-from-left delay-[300ms]' />
          <p
            className='text-muted-foreground text-lg max-w-md fade-in-from-left
              delay-[400ms]'
          >
            Sign in to access the admin panel.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div
        className='flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12
          fade-in-from-top'
      >
        <Card className='w-full max-w-md'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl font-bold fade-in-from-top delay-[100ms]'>
              Welcome back
            </CardTitle>
            <CardDescription className='fade-in-from-top delay-[200ms]'>
              Enter your credentials to sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='fade-in-from-top delay-[250ms]'>
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='m@example.com'
                          autoComplete='email'
                          {...field}
                          className='fade-in-from-top delay-[300ms]'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='fade-in-from-top delay-[350ms]'>
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='password'
                          placeholder='Enter password'
                          autoComplete='current-password'
                          {...field}
                          className='fade-in-from-top delay-[400ms]'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type='submit'
                  className='w-full fade-in-from-top delay-[450ms]'
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner /> Signing In...
                    </>
                  ) : (
                    <>
                      Sign In <LogIn />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
