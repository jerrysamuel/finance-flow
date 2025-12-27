import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { expensesAPI, categoriesAPI, Expense, ExpenseInput, Category } from '@/lib/api';
import { cn } from '@/lib/utils';
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
import {
  Upload as UploadIcon,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { format } from 'date-fns';

interface PreviewTransaction extends Expense {
  isEditing?: boolean;
}

const Upload: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previewTransactions, setPreviewTransactions] = useState<PreviewTransaction[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getAll();
      return response.data || [];
    },
  });

  // Upload mutation - returns preview
  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      expensesAPI.upload(file, (progress) => setUploadProgress(progress)),
    onSuccess: (response) => {
      const data = response.data;
      if (data?.transactions) {
        setPreviewTransactions(data.transactions);
        setShowPreview(true);
        toast({
          title: 'File parsed successfully',
          description: `${data.transactions.length} transactions found. Review and save.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Upload failed',
        description:
          error.response?.data?.message ||
          'Failed to process the file. Please try again.',
        variant: 'destructive',
      });
      setUploadProgress(0);
    },
  });

  // Bulk create mutation
  const bulkCreateMutation = useMutation({
    mutationFn: (transactions: ExpenseInput[]) =>
      expensesAPI.bulkCreate(transactions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast({
        title: 'Transactions saved!',
        description: `${previewTransactions.length} transactions have been added.`,
      });
      resetUpload();
      navigate('/expenses');
    },
    onError: (error: any) => {
      toast({
        title: 'Save failed',
        description:
          error.response?.data?.message ||
          'Failed to save transactions. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile);
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV or Excel file.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile);
    } else if (selectedFile) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV or Excel file.',
        variant: 'destructive',
      });
    }
  };

  const isValidFile = (file: File): boolean => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const validExtensions = ['.csv', '.xls', '.xlsx'];
    
    return (
      validTypes.includes(file.type) ||
      validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    );
  };

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleSaveAll = () => {
    const transactions: ExpenseInput[] = previewTransactions.map((t) => ({
      amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount,
      category: t.category,
      description: t.description,
      date: t.date,
      transaction_type: t.transaction_type,
      notes: t.notes,
    }));
    bulkCreateMutation.mutate(transactions);
  };

  const handleCategoryChange = (index: number, categoryId: string) => {
    setPreviewTransactions((prev) =>
      prev.map((t, i) =>
        i === index
          ? {
              ...t,
              category: parseInt(categoryId),
              category_name: categories.find((c: Category) => c.id === parseInt(categoryId))?.name,
            }
          : t
      )
    );
  };

  const removeTransaction = (index: number) => {
    setPreviewTransactions((prev) => prev.filter((_, i) => i !== index));
  };

  const resetUpload = () => {
    setFile(null);
    setUploadProgress(0);
    setPreviewTransactions([]);
    setShowPreview(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const getFileIcon = () => {
    if (!file) return <UploadIcon className="h-12 w-12" />;
    if (file.name.endsWith('.csv')) return <FileSpreadsheet className="h-12 w-12" />;
    return <FileText className="h-12 w-12" />;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Upload Statement
          </h1>
          <p className="text-muted-foreground">
            Upload your bank statement (CSV/Excel) to automatically import and categorize
            transactions
          </p>
        </div>

        {!showPreview ? (
          /* Upload Area */
          <div className="max-w-2xl mx-auto">
            <div
              className={cn(
                "card-elevated p-8 border-2 border-dashed transition-all duration-200",
                isDragging && "border-primary bg-primary/5",
                file && "border-solid border-primary/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {!file ? (
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <UploadIcon className="h-10 w-10" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Drag & drop your statement
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    or click to browse your files
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" asChild>
                      <span className="cursor-pointer">Browse Files</span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supported formats: CSV, Excel (.xls, .xlsx)
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* File Info */}
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {getFileIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    {!uploadMutation.isPending && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={resetUpload}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {uploadMutation.isPending && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Processing...</span>
                        <span className="font-medium">{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  {uploadMutation.isError && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Upload failed. Please try again.</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={resetUpload}
                      disabled={uploadMutation.isPending}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={uploadMutation.isPending}
                      className="flex-1"
                    >
                      {uploadMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <UploadIcon className="h-5 w-5" />
                          Upload & Preview
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-8 card-elevated p-6">
              <h3 className="font-semibold mb-4">How it works</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    1
                  </span>
                  <span>
                    Download your bank statement in CSV or Excel format
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    2
                  </span>
                  <span>
                    Upload the file - we'll parse and auto-categorize transactions
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    3
                  </span>
                  <span>
                    Review the preview and adjust categories if needed
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    4
                  </span>
                  <span>
                    Click "Save All" to import transactions to your account
                  </span>
                </li>
              </ol>
            </div>
          </div>
        ) : (
          /* Preview Area */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Review Transactions ({previewTransactions.length})
                </h2>
                <p className="text-sm text-muted-foreground">
                  Review and adjust categories before saving
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetUpload}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAll}
                  disabled={bulkCreateMutation.isPending || previewTransactions.length === 0}
                >
                  {bulkCreateMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Save All ({previewTransactions.length})
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="card-elevated overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewTransactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className={cn(
                          "flex items-center gap-2",
                          transaction.transaction_type === 'CREDIT' ? "text-income" : "text-expense"
                        )}>
                          {transaction.transaction_type === 'CREDIT' ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          <span className="text-xs font-medium">
                            {transaction.transaction_type === 'CREDIT' ? 'Credit' : 'Debit'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={transaction.category?.toString() || ''}
                          onValueChange={(value) => handleCategoryChange(index, value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category: Category) => (
                              <SelectItem key={category.id} value={String(category.id)}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-semibold tabular-nums",
                        transaction.transaction_type === 'CREDIT' ? "text-income" : "text-expense"
                      )}>
                        {transaction.transaction_type === 'CREDIT' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTransaction(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Upload;
