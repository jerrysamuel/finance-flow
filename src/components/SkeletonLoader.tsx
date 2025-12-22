import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'chart' | 'table';
  count?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'card',
  count = 1,
  className,
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="stat-card space-y-3">
            <div className="skeleton-shimmer h-4 w-24" />
            <div className="skeleton-shimmer h-8 w-32" />
            <div className="skeleton-shimmer h-3 w-20" />
          </div>
        );

      case 'list':
        return (
          <div className="flex items-center gap-4 p-4 border-b border-border">
            <div className="skeleton-shimmer h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-shimmer h-4 w-32" />
              <div className="skeleton-shimmer h-3 w-24" />
            </div>
            <div className="skeleton-shimmer h-4 w-16" />
          </div>
        );

      case 'chart':
        return (
          <div className="card-elevated p-6 space-y-4">
            <div className="skeleton-shimmer h-6 w-40" />
            <div className="skeleton-shimmer h-64 w-full rounded-lg" />
          </div>
        );

      case 'table':
        return (
          <div className="space-y-2">
            <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton-shimmer h-4 flex-1" />
              ))}
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border-b border-border">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="skeleton-shimmer h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {[...Array(count)].map((_, i) => (
        <React.Fragment key={i}>{renderSkeleton()}</React.Fragment>
      ))}
    </div>
  );
};

export default SkeletonLoader;
