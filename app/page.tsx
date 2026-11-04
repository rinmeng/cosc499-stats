import Link from 'next/link';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { Text } from '@/components/Text';
// import Messages from '@/components/Messages';
import { getDelayClass } from '@/utils/animations';
import { ArrowRight, SquareArrowOutUpRight } from 'lucide-react';

const cards = [
  {
    title: 'Fast Development',
    description: 'Start building immediately',
    content:
      '65+ shadcn/ui components on Base UI, Supabase auth wiring, and dark mode, all ready to go out of the box.',
  },
  {
    title: 'Type Safe',
    description: 'Full TypeScript support',
    content:
      'TypeScript 7 across the app, Zod schemas for forms, and shared types in one place under lib/types.',
  },
  {
    title: 'Production Ready',
    description: 'Deploy with confidence',
    content:
      'Formatting and linting checked in CI, Vercel Analytics built in, and one-click deploy to Vercel.',
  },
];

export default function Home() {
  return (
    <div className='container mx-auto px-4 nb-padding fade-in-from-bottom'>
      <div className='mx-auto max-w-6xl gap-6 flex flex-col'>
        <div className='text-center'>
          <Text variant='hd-xxl' className='mb-4 tracking-tight fade-in-from-bottom'>
            Next.js Starter Template
          </Text>
          <Text
            variant='muted'
            size='md'
            className='mx-auto max-w-2xl fade-in-from-bottom delay-[100ms]'
          >
            A modern boilerplate with Next.js 16, React 19, shadcn/ui, Tailwind CSS v4,
            and Supabase. Get started building your next project with this
            production-ready starter, beautifully designed by rin.
          </Text>
        </div>

        <div className='grid gap-6 md:grid-cols-3 delay-[300ms]'>
          {cards.map((card, idx) => (
            <Card
              key={card.title}
              className={`fade-in-from-bottom ${getDelayClass(idx + 5)}`}
            >
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Text variant='muted' size='sm'>
                  {card.content}
                </Text>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='text-center'>
          <div className='flex flex-wrap justify-center gap-4'>
            <Link href='/features'>
              <Button size='lg' className='fade-in-from-bottom delay-[550ms]'>
                Check out the features <ArrowRight />
              </Button>
            </Link>
            <Button
              size='lg'
              variant='outline'
              className='fade-in-from-bottom delay-[600ms]'
              nativeButton={false}
              render={
                <a
                  href='https://github.com/rinmeng/next-shadcn-supabase-starter'
                  target='_blank'
                  rel='noopener noreferrer'
                />
              }
            >
              View on GitHub <SquareArrowOutUpRight />
            </Button>
          </div>
        </div>
        {/* if you want a quick test for data base stuff, make sure you uncomment this and check the component.*/}
        {/* <div className='fade-in-from-bottom delay-[700ms]'>
          <Messages />
        </div> */}
      </div>
    </div>
  );
}
