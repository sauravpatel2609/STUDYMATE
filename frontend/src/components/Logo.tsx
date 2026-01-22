// ===================================
// Logo Component
// ===================================

import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md" />
        <div className="relative bg-gradient-to-br from-primary to-[hsl(199,89%,48%)] p-2 rounded-lg">
          <GraduationCap className={cn('text-primary-foreground', sizeClasses[size])} />
        </div>
      </div>
      {showText && (
        <span className={cn('font-bold tracking-tight', textSizeClasses[size])}>
          <span className="text-foreground">Study</span>
          <span className="text-primary">Mate</span>
        </span>
      )}
    </div>
  );
}
