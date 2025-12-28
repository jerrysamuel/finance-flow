import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryRulesAPI, categoriesAPI, CategoryRule, Category } from '@/lib/api';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Wand2, Search } from 'lucide-react';

const CategoryRules: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CategoryRule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    description_keyword: '',
    category: '',
  });

  const { data: rules, isLoading } = useQuery({
    queryKey: ['category-rules'],
    queryFn: async () => {
      const response = await categoryRulesAPI.getAll();
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
    mutationFn: categoryRulesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-rules'] });
      toast({ title: 'Rule created successfully' });
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to create rule', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CategoryRule> }) =>
      categoryRulesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-rules'] });
      toast({ title: 'Rule updated successfully' });
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to update rule', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryRulesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-rules'] });
      toast({ title: 'Rule deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete rule', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      description_keyword: '',
      category: '',
    });
    setEditingRule(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      description_keyword: formData.description_keyword,
      category: parseInt(formData.category),
    };

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (rule: CategoryRule) => {
    setEditingRule(rule);
    setFormData({
      description_keyword: rule.description_keyword,
      category: rule.category.toString(),
    });
    setIsDialogOpen(true);
  };

  const getCategoryName = (categoryId: number) => {
    return categories?.find((c: Category) => c.id === categoryId)?.name || 'Unknown';
  };

  const filteredRules = rules?.filter((rule: CategoryRule) =>
    rule.description_keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rule.category_name || getCategoryName(rule.category))
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Category Rules</h1>
            <p className="text-muted-foreground">
              Auto-categorize transactions based on keywords
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Edit Rule' : 'Create Rule'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyword">Keyword</Label>
                  <Input
                    id="keyword"
                    placeholder="e.g., AMAZON, NETFLIX, UBER"
                    value={formData.description_keyword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description_keyword: e.target.value,
                      })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Transactions containing this keyword will be auto-categorized
                  </p>
                </div>
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
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingRule ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Rules Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Auto-Categorization Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : filteredRules?.length === 0 ? (
              <div className="text-center py-12">
                <Wand2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No rules found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? 'No rules match your search'
                    : 'Create rules to auto-categorize transactions'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Rule
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules?.map((rule: CategoryRule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        <code className="px-2 py-1 bg-muted rounded text-sm">
                          {rule.description_keyword}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {rule.category_name || getCategoryName(rule.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(rule.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(rule)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(rule.id)}
                            className="text-expense hover:text-expense"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Wand2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-1">
                  How it works
                </h4>
                <p className="text-sm text-muted-foreground">
                  When you upload transactions, the system checks each description
                  against your rules. If a keyword matches, the transaction is
                  automatically assigned to the corresponding category. Keywords
                  are case-insensitive.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CategoryRules;
