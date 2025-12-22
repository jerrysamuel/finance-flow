import React from 'react';
import { cn } from '@/lib/utils';
import { FileQuestion, AlertCircle, Search, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  type?: 'empty' | 'error' | 'search' | 'no-data';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'empty',
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}) => {
  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'error':
        return <AlertCircle className="h-12 w-12 text-destructive" />;
      case 'search':
        return <Search className="h-12 w-12 text-muted-foreground" />;
      case 'no-data':
        return <Inbox className="h-12 w-12 text-muted-foreground" />;
      default:
        return <FileQuestion className="h-12 w-12 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
        {getIcon()}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
