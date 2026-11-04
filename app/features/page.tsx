import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { getDelayClass } from '@/utils/animations';
import {
  Shield,
  Lock,
  Route,
  Zap,
  Code2,
  Layers,
  Paintbrush,
  Box,
  Server,
  FileCode,
  Workflow,
  Rocket,
  CheckCircle2,
  Sparkles,
  ToggleLeft,
  Moon,
  Bell,
  GitBranch,
  FolderTree,
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Authentication & Security',
    description: 'Supabase auth wired up and ready to switch on',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    items: [
      { icon: Lock, label: 'Supabase Auth' },
      { icon: Workflow, label: 'SSR Session Refresh' },
      { icon: Shield, label: 'proxy.ts Middleware' },
      { icon: Route, label: 'Protected Routes' },
      { icon: ToggleLeft, label: 'Auth Toggle' },
    ],
  },
  {
    icon: Code2,
    title: 'Modern Tech Stack',
    description: 'Latest versions of the tools you already know',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    items: [
      { icon: Zap, label: 'Next.js' },
      { icon: Box, label: 'React' },
      { icon: Code2, label: 'TypeScript' },
      { icon: Paintbrush, label: 'Tailwind CSS' },
      { icon: Layers, label: 'shadcn/ui + Base UI' },
    ],
  },
  {
    icon: Layers,
    title: 'Scalable Architecture',
    description: 'A project structure that stays tidy as you grow',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    items: [
      { icon: Route, label: 'App Router' },
      { icon: Server, label: 'Server Components' },
      { icon: FileCode, label: 'Context + Hooks' },
      { icon: FolderTree, label: 'Centralized Types' },
      { icon: Bell, label: 'Toast Provider' },
    ],
  },
  {
    icon: Rocket,
    title: 'Developer Experience',
    description: 'Tools that boost productivity',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    items: [
      { icon: CheckCircle2, label: 'ESLint' },
      { icon: Sparkles, label: 'Prettier + Sorted Imports' },
      { icon: GitBranch, label: 'GitHub Actions CI' },
      { icon: CheckCircle2, label: 'Zod + React Hook Form' },
      { icon: Moon, label: 'Dark Mode' },
    ],
  },
];

export default function Features() {
  return (
    <div className='container nb-padding mx-auto px-4'>
      <div className='mx-auto max-w-6xl'>
        {/* Header */}
        <div className='mb-12 text-center'>
          <h1 className='mb-4 text-5xl font-bold fade-in-from-right'>Features</h1>
          <p
            className='text-xl text-muted-foreground max-w-2xl mx-auto fade-in-from-right
              delay-[100ms]'
          >
            A comprehensive starter template with everything you need to build modern web
            applications
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className='grid gap-6 md:grid-cols-2'>
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className={`fade-in-from-right ${getDelayClass(idx + 2)}`}
              >
                <CardHeader>
                  <div className='flex items-start gap-4'>
                    <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <div className='flex-1'>
                      <CardTitle className='text-xl'>{feature.title}</CardTitle>
                      <CardDescription className='mt-1'>
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-wrap gap-2'>
                    {feature.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <Badge variant='secondary' key={item.label}>
                          <ItemIcon />
                          {item.label}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
