import { cn } from '@/lib/utils';

/** Renders a finding sentence, bolding the `**…**` parts (the numbers that matter). */
export function FindingText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <span className={cn('text-pretty', className)}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className='font-semibold text-foreground'>
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </span>
  );
}
