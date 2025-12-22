import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import ExpenseItem from '@/components/ExpenseItem';
import ExpenseForm from '@/components/ExpenseForm';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { expensesAPI, categoriesAPI, Expense, ExpenseInput, Category } from '@/lib/api';
import { Plus, Search, Filter } from 'lucide-react';

const Expenses: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Fetch expenses
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', typeFilter],
    queryFn: async () => {
      const params: any = {};
      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }
      const response = await expensesAPI.getAll(params);
      return response.data?.results || response.data || [];
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getAll();
      return response.data?.results || response.data || [];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ExpenseInput) => expensesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast({ title: 'Transaction added successfully' });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error adding transaction',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ExpenseInput> }) =>
      expensesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast({ title: 'Transaction updated successfully' });
      setEditingExpense(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating transaction',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast({ title: 'Transaction deleted successfully' });
      setDeletingExpense(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting transaction',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = async (data: ExpenseInput) => {
    await createMutation.mutateAsync(data);
  };

  const handleUpdate = async (data: ExpenseInput) => {
    if (editingExpense) {
      await updateMutation.mutateAsync({ id: editingExpense.id, data });
    }
  };

  const handleDelete = () => {
    if (deletingExpense) {
      deleteMutation.mutate(deletingExpense.id);
    }
  };

  // Filter expenses by search query
  const filteredExpenses = expenses?.filter((expense: Expense) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      expense.description?.toLowerCase().includes(query) ||
      expense.category_name?.toLowerCase().includes(query) ||
      String(expense.amount).includes(query)
    );
  }) || [];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">
              Manage your income and expenses
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expenses List */}
        <div className="card-elevated">
          {expensesLoading ? (
            <SkeletonLoader type="list" count={8} />
          ) : filteredExpenses.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredExpenses.map((expense: Expense) => (
                <ExpenseItem
                  key={expense.id}
                  expense={expense}
                  onEdit={setEditingExpense}
                  onDelete={setDeletingExpense}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              type={searchQuery ? 'search' : 'no-data'}
              title={searchQuery ? 'No results found' : 'No transactions yet'}
              description={
                searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Start by adding your first transaction'
              }
              actionLabel={searchQuery ? undefined : 'Add Transaction'}
              onAction={searchQuery ? undefined : () => setIsFormOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isFormOpen || !!editingExpense}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingExpense(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Edit Transaction' : 'Add Transaction'}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm
            categories={categories}
            initialData={editingExpense}
            onSubmit={editingExpense ? handleUpdate : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingExpense(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingExpense}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Expenses;
