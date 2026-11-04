import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { Shield, Lock, SquareArrowOutUpRight } from 'lucide-react';

export default function Admin() {
  return (
    <div className='nb-padding max-w-2xl mx-auto px-4 fade-in-from-right'>
      <Card>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <div className='p-3 rounded-full bg-primary/10'>
              <Shield className='h-8 w-8 text-primary' />
            </div>
          </div>
          <CardTitle className='text-2xl sm:text-3xl'>
            Admin Page - Protected Route
          </CardTitle>
          <CardDescription className='text-sm sm:text-base'>
            This page is a protected route that only authenticated users can see.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex-col space-y-4 justify-center flex'>
          <div className='flex items-start gap-3 p-3 sm:p-4 rounded-lg border bg-muted/50'>
            <Lock className='h-5 w-5 text-muted-foreground mt-0.5 shrink-0' />
            <div>
              <p className='font-medium mb-1 text-sm sm:text-base'>Route Protection</p>
              <p className='text-xs sm:text-sm text-muted-foreground'>
                This is an example usage of proxy/middleware to restrict access to
                authenticated users only.
              </p>
            </div>
          </div>

          <Button
            variant='default'
            className='w-full sm:w-auto mx-auto'
            nativeButton={false}
            render={
              <a
                href='https://github.com/rinmeng/next-shadcn-supabase-starter/blob/main/proxy.ts'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-2'
              />
            }
          >
            View proxy.ts
            <SquareArrowOutUpRight className='h-3 w-3' />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
