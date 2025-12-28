import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetsAPI, categoriesAPI, Budget, Category } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const Budgets: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
  });

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const response = await budgetsAPI.getAll();
      return response.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: budgetsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget created successfully' });
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to create budget', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Budget> }) =>
      budgetsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget updated successfully' });
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to update budget', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: budgetsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete budget', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      category: '',
      amount: '',
      month: new Date().toISOString().slice(0, 7),
    });
    setEditingBudget(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      category: parseInt(formData.category),
      amount: parseFloat(formData.amount),
      month: `${formData.month}-01`, // Backend expects YYYY-MM-01
    };

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category.toString(),
      amount: budget.amount.toString(),
      month: budget.month.slice(0, 7),
    });
    setIsDialogOpen(true);
  };

  const getProgressPercentage = (budget: Budget) => {
    const spent = budget.spent || 0;
    return Math.min((spent / budget.amount) * 100, 100);
  };

  const getCategoryName = (categoryId: number) => {
    return categories?.find((c: Category) => c.id === categoryId)?.name || 'Unknown';
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Budgets</h1>
            <p className="text-muted-foreground">
              Set spending limits and track your progress
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBudget ? 'Edit Budget' : 'Create Budget'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category: Category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Budget Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Input
                    id="month"
                    type="month"
                    value={formData.month}
                    onChange={(e) =>
                      setFormData({ ...formData, month: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingBudget ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Budgets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-5 bg-muted rounded w-24" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-32 mb-4" />
                  <div className="h-2 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : budgets?.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first budget to start tracking your spending
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Budget
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets?.map((budget: Budget) => {
              const percentage = getProgressPercentage(budget);
              const isOverBudget = budget.is_over_budget;
              const spent = budget.spent || 0;
              const remaining = budget.remaining || budget.amount - spent;

              return (
                <Card
                  key={budget.id}
                  className={cn(
                    'relative overflow-hidden transition-all hover:shadow-lg',
                    isOverBudget && 'border-expense/50'
                  )}
                >
                  {isOverBudget && (
                    <div className="absolute top-0 right-0 p-2">
                      <AlertTriangle className="h-5 w-5 text-expense" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      {budget.category_name || getCategoryName(budget.category)}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {new Date(budget.month).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold">
                        ${spent.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        of ${budget.amount.toFixed(2)}
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className={cn(
                        'h-2',
                        isOverBudget && '[&>div]:bg-expense'
                      )}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={cn(
                          isOverBudget ? 'text-expense' : 'text-income'
                        )}
                      >
                        {isOverBudget
                          ? `$${Math.abs(remaining).toFixed(2)} over`
                          : `$${remaining.toFixed(2)} remaining`}
                      </span>
                      <span className="text-muted-foreground">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(budget)}
                        className="flex-1"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(budget.id)}
                        className="flex-1 text-expense hover:text-expense"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Budgets;
