import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface AnimatedSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'pulse' | 'shimmer' | 'wave';
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const getAnimationStyle = (variant: 'pulse' | 'shimmer' | 'wave') => {
  switch (variant) {
    case 'pulse':
      return 'animate-pulse';
    case 'shimmer':
      return 'overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent';
    case 'wave':
      return 'animate-wave overflow-hidden';
    default:
      return 'animate-pulse';
  }
};

const getRoundedClass = (rounded: 'none' | 'sm' | 'md' | 'lg' | 'full') => {
  switch (rounded) {
    case 'none':
      return 'rounded-none';
    case 'sm':
      return 'rounded-sm';
    case 'md':
      return 'rounded-md';
    case 'lg':
      return 'rounded-lg';
    case 'full':
      return 'rounded-full';
    default:
      return 'rounded-md';
  }
};

export function AnimatedSkeleton({
  className,
  variant = 'pulse',
  width,
  height,
  rounded = 'md',
  ...props
}: AnimatedSkeletonProps) {
  const animationClass = getAnimationStyle(variant);
  const roundedClass = getRoundedClass(rounded);
  
  return (
    <Skeleton
      className={cn(
        'relative bg-muted/60',
        animationClass,
        roundedClass,
        className
      )}
      style={{
        width: width,
        height: height,
        ...(props.style || {})
      }}
      {...props}
    />
  );
}

export interface AnimatedCardSkeletonProps {
  imageHeight?: string | number;
  lines?: number;
  hasFooter?: boolean;
  className?: string;
  variant?: 'pulse' | 'shimmer' | 'wave';
}

export function AnimatedCardSkeleton({
  imageHeight = '180px',
  lines = 3,
  hasFooter = true,
  className,
  variant = 'shimmer'
}: AnimatedCardSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Card image */}
      <AnimatedSkeleton height={imageHeight} variant={variant} />
      
      {/* Card content */}
      <div className="space-y-2">
        <AnimatedSkeleton height="24px" variant={variant} />
        {Array.from({ length: lines }).map((_, i) => (
          <AnimatedSkeleton 
            key={i} 
            height="16px" 
            width={i === lines - 1 ? '70%' : '100%'}
            variant={variant}
          />
        ))}
      </div>
      
      {/* Card footer */}
      {hasFooter && (
        <AnimatedSkeleton height="36px" variant={variant} />
      )}
    </div>
  );
}

export interface AnimatedFeedSkeletonProps {
  count?: number;
  className?: string;
  variant?: 'pulse' | 'shimmer' | 'wave';
}

export function AnimatedFeedSkeleton({ 
  count = 3, 
  className,
  variant = 'shimmer'
}: AnimatedFeedSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          {/* Header with avatar */}
          <div className="flex items-center gap-3">
            <AnimatedSkeleton height={40} width={40} rounded="full" variant={variant} />
            <div className="space-y-1">
              <AnimatedSkeleton height="18px" width={120} variant={variant} />
              <AnimatedSkeleton height="14px" width={80} variant={variant} />
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <AnimatedSkeleton height="16px" variant={variant} />
            <AnimatedSkeleton height="16px" variant={variant} />
            <AnimatedSkeleton height="16px" width="75%" variant={variant} />
          </div>
          
          {/* Footer */}
          <div className="flex gap-2 pt-2">
            <AnimatedSkeleton height="24px" width={60} variant={variant} />
            <AnimatedSkeleton height="24px" width={60} variant={variant} />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface AnimatedTableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
  variant?: 'pulse' | 'shimmer' | 'wave';
}

export function AnimatedTableSkeleton({
  rows = 5,
  columns = 4,
  className,
  variant = 'shimmer'
}: AnimatedTableSkeletonProps) {
  return (
    <div className={cn('w-full border rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 p-3 border-b bg-muted/10">
        {Array.from({ length: columns }).map((_, i) => (
          <AnimatedSkeleton 
            key={`header-${i}`} 
            className={`col-span-${12 / columns}`}
            height="24px"
            variant={variant}
          />
        ))}
      </div>
      
      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`row-${i}`} className="grid grid-cols-12 gap-4 p-3">
            {Array.from({ length: columns }).map((_, j) => (
              <AnimatedSkeleton 
                key={`cell-${i}-${j}`} 
                className={`col-span-${12 / columns}`}
                height="16px"
                variant={variant}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface AnimatedProfileSkeletonProps {
  className?: string;
  variant?: 'pulse' | 'shimmer' | 'wave';
}

export function AnimatedProfileSkeleton({
  className,
  variant = 'shimmer'
}: AnimatedProfileSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with avatar and name */}
      <div className="flex items-center gap-5">
        <AnimatedSkeleton height={80} width={80} rounded="full" variant={variant} />
        <div className="space-y-2">
          <AnimatedSkeleton height="28px" width={180} variant={variant} />
          <AnimatedSkeleton height="18px" width={120} variant={variant} />
        </div>
      </div>
      
      {/* Profile sections */}
      <div className="space-y-4">
        <AnimatedSkeleton height="20px" width={150} variant={variant} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedSkeleton height="90px" variant={variant} />
          <AnimatedSkeleton height="90px" variant={variant} />
        </div>
      </div>
      
      <div className="space-y-4">
        <AnimatedSkeleton height="20px" width={180} variant={variant} />
        <AnimatedSkeleton height="120px" variant={variant} />
      </div>
    </div>
  );
}

export function AnimatedConnectionCardSkeleton({
  className,
  variant = 'shimmer'
}: {
  className?: string;
  variant?: 'pulse' | 'shimmer' | 'wave';
}) {
  return (
    <div className={cn("p-4 rounded-lg border", className)}>
      <div className="flex items-center space-x-4">
        <AnimatedSkeleton 
          height="12" 
          width="12" 
          rounded="full" 
          variant={variant} 
        />
        <div className="space-y-2">
          <AnimatedSkeleton height="18px" width="200px" variant={variant} />
          <AnimatedSkeleton height="16px" width="150px" variant={variant} />
        </div>
        <div className="flex space-x-2 ml-auto">
          <AnimatedSkeleton height="36px" width="80px" variant={variant} />
        </div>
      </div>
    </div>
  );
}

// Add custom keyframes for shimmer animation in global CSS
if (typeof document !== 'undefined') {
  // Only run in browser environment
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      100% {
        transform: translateX(100%);
      }
    }
    
    @keyframes wave {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: 200px 0;
      }
    }
    
    .animate-wave {
      background: linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.12) 37%, rgba(0,0,0,0.06) 63%);
      background-size: 400px 100%;
      animation: wave 1.5s infinite linear;
    }
  `;
  document.head.appendChild(style);
}