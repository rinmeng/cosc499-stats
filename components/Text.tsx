import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import React from 'react';

const textVariants = cva('', {
  variants: {
    variant: {
      // Headings — size is self-contained and responsive, `size` prop is ignored
      'hd-xs': 'text-sm md:text-base lg:text-lg font-semibold',
      'hd-sm': 'text-base md:text-lg lg:text-xl font-semibold',
      'hd-md': 'text-lg md:text-xl lg:text-2xl font-bold',
      'hd-lg': 'text-xl md:text-2xl lg:text-3xl font-bold',
      'hd-xl': 'text-2xl md:text-4xl lg:text-5xl font-bold',
      'hd-xxl': 'text-3xl md:text-5xl lg:text-6xl font-bold',
      // Semantic variants — only style, scale comes from `size` prop
      default: '',
      muted: 'text-muted-foreground',
      caption: 'text-muted-foreground',
      label: 'font-medium',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-sm md:text-base lg:text-lg',
      lg: 'text-base md:text-lg lg:text-xl',
      xl: 'text-lg md:text-xl lg:text-2xl',
      xxl: 'text-xl md:text-2xl lg:text-3xl',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

type TextVariant = NonNullable<VariantProps<typeof textVariants>['variant']>;
type TextSize = NonNullable<VariantProps<typeof textVariants>['size']>;

const VARIANT_ELEMENT_MAP: Record<TextVariant, React.ElementType> = {
  'hd-xxl': 'h1',
  'hd-xl': 'h2',
  'hd-lg': 'h3',
  'hd-md': 'h4',
  'hd-sm': 'h5',
  'hd-xs': 'h6',
  default: 'p',
  muted: 'p',
  caption: 'p',
  label: 'span', // styling only — use as="label" htmlFor="..." for real form labels
};

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  size?: TextSize;
  as?: React.ElementType;
  children: React.ReactNode;
}

export function Text({
  variant = 'default',
  size = 'md',
  as,
  className,
  children,
  ...props
}: TextProps) {
  const Comp = as ?? VARIANT_ELEMENT_MAP[variant];
  const isHeading = variant.startsWith('hd-');

  return (
    <Comp
      className={cn(textVariants({ variant, size: isHeading ? null : size }), className)}
      {...props}
    >
      {children}
    </Comp>
  );
}
