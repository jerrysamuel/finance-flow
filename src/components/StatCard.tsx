import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  type?: 'default' | 'income' | 'expense' | 'balance';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  type = 'default',
  className,
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val;
  };

  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null;
    if (trend > 0) return <TrendingUp className="h-4 w-4" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === null) return 'text-muted-foreground';
    if (type === 'expense') {
      return trend > 0 ? 'text-expense' : 'text-income';
    }
    return trend > 0 ? 'text-income' : 'text-expense';
  };

  return (
    <div
      className={cn(
        'stat-card',
        type === 'income' && 'stat-card-income',
        type === 'expense' && 'stat-card-expense',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            "text-2xl font-bold tabular-nums",
            type === 'income' && 'text-income',
            type === 'expense' && 'text-expense',
            type === 'balance' && 'gradient-text'
          )}>
            {formatValue(value)}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            type === 'income' && 'bg-income/10 text-income',
            type === 'expense' && 'bg-expense/10 text-expense',
            type === 'balance' && 'bg-primary/10 text-primary',
            type === 'default' && 'bg-muted text-muted-foreground'
          )}>
            {icon}
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className={cn("flex items-center gap-1 mt-3 text-sm", getTrendColor())}>
          {getTrendIcon()}
          <span className="font-medium">
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          {trendLabel && (
            <span className="text-muted-foreground ml-1">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
