import { type LucideIcon, type LucideProps } from 'lucide-react';
import { cn } from '@/utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';

const iconVariants = cva('shrink-0', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-8 w-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const sizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export interface IconProps
  extends Omit<LucideProps, 'ref' | 'size'>,
    VariantProps<typeof iconVariants> {
  icon: LucideIcon;
}

export function Icon({ icon: IconComponent, size = 'md', className, ...props }: IconProps) {
  const iconSize = size ? sizeMap[size] : sizeMap.md;

  return (
    <IconComponent
      className={cn(iconVariants({ size }), className)}
      size={iconSize}
      {...props}
    />
  );
}
