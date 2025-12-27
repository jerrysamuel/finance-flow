import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Expense } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExpenseItemProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({ expense, onEdit, onDelete }) => {
  // CREDIT = income (money coming in), DEBIT = expense (money going out)
  const isCredit = expense.transaction_type === 'CREDIT';
  const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getCategoryIcon = () => {
    const iconClass = cn(
      "flex h-10 w-10 items-center justify-center rounded-lg",
      isCredit ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
    );

    return (
      <div className={iconClass}>
        {isCredit ? (
          <ArrowUpRight className="h-5 w-5" />
        ) : (
          <ArrowDownRight className="h-5 w-5" />
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors group">
      {getCategoryIcon()}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {expense.description || expense.category_name || 'Transaction'}
        </p>
        <p className="text-sm text-muted-foreground">
          {expense.category_name || 'Uncategorized'} • {format(new Date(expense.date), 'MMM d, yyyy')}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-semibold tabular-nums",
            isCredit ? "text-income" : "text-expense"
          )}
        >
          {isCredit ? '+' : '-'}{formatCurrency(amount)}
        </span>

        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(expense)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(expense)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default ExpenseItem;
