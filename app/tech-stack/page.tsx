import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { getDelayClass } from '@/utils/animations';
import Image from 'next/image';

const techStack = [
  {
    name: 'Next.js',
    description: 'App Router, Server Components, and proxy.ts',
    version: 'v16',
    icon: '/icons/nextjs.svg',
    category: 'Framework',
    url: 'https://nextjs.org',
  },
  {
    name: 'React',
    description: 'UI library for building interfaces',
    version: 'v19',
    icon: '/icons/react.svg',
    category: 'Library',
    url: 'https://react.dev',
  },
  {
    name: 'TypeScript',
    description: 'Typed JavaScript at scale',
    version: 'v7',
    icon: '/icons/typescript.svg',
    category: 'Language',
    url: 'https://www.typescriptlang.org',
  },
  {
    name: 'Tailwind CSS',
    description: 'Utility-first CSS, configured entirely in CSS',
    version: 'v4',
    icon: '/icons/tailwind.svg',
    category: 'Styling',
    url: 'https://tailwindcss.com',
  },
  {
    name: 'Shadcn UI',
    description: '65+ components built on Base UI (base-lyra style)',
    version: 'CLI v4',
    icon: '/icons/shadcn.svg',
    category: 'Components',
    url: 'https://ui.shadcn.com',
  },
  {
    name: 'Supabase',
    description: 'Auth and database via @supabase/ssr',
    version: 'supabase-js v2',
    icon: '/icons/supabase.svg',
    category: 'Backend',
    url: 'https://supabase.com',
  },
  {
    name: 'PostgreSQL',
    description: 'Postgres database included with every Supabase project',
    icon: '/icons/postgres.svg',
    category: 'Database',
    url: 'https://www.postgresql.org',
  },
  {
    name: 'ESLint',
    description: 'Next.js core web vitals + TypeScript rules',
    version: 'v9',
    icon: '/icons/eslint.svg',
    category: 'Code Quality',
    url: 'https://eslint.org',
  },
  {
    name: 'Prettier',
    description: 'Formatting with auto-sorted imports and Tailwind classes',
    version: 'v3',
    icon: '/icons/prettier.svg',
    category: 'Code Quality',
    url: 'https://prettier.io',
  },
];

export default function TechStack() {
  return (
    <div className='container nb-padding mx-auto px-4'>
      <div className='mx-auto max-w-6xl'>
        {/* Header */}
        <div className='mb-12 text-center fade-in-from-top'>
          <h1 className='mb-4 text-5xl font-bold'>Tech Stack</h1>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Built with modern, battle-tested technologies for optimal performance and
            developer experience
          </p>
        </div>

        {/* Tech Stack Grid */}
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {techStack.map((tech, index) => (
            <Card
              key={tech.name}
              className={`fade-in-from-bottom ${getDelayClass(index + 1)}`}
            >
              <CardHeader>
                <a
                  className='flex items-center gap-4'
                  href={tech.url}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <div className='relative h-12 w-12 shrink-0'>
                    <Image
                      src={tech.icon}
                      alt={`${tech.name} logo`}
                      width={48}
                      height={48}
                      className='object-contain dark:invert not-dark:invert-0'
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <CardTitle className='text-lg'>{tech.name}</CardTitle>
                      {tech.version && <Badge variant='secondary'>{tech.version}</Badge>}
                    </div>
                    <CardDescription className='text-xs'>{tech.category}</CardDescription>
                  </div>
                </a>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>{tech.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
