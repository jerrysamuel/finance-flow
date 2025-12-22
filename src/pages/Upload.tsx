import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { statementsAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Upload as UploadIcon,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileSpreadsheet,
} from 'lucide-react';

const Upload: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      statementsAPI.upload(file, (progress) => setUploadProgress(progress)),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast({
        title: 'Statement uploaded successfully',
        description: `${response.data?.transactions_count || 'Your'} transactions have been processed.`,
      });
      setFile(null);
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast({
        title: 'Upload failed',
        description:
          error.response?.data?.message ||
          'Failed to process the statement. Please try again.',
        variant: 'destructive',
      });
      setUploadProgress(0);
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
        description: 'Please upload a CSV or PDF file.',
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
        description: 'Please upload a CSV or PDF file.',
        variant: 'destructive',
      });
    }
  };

  const isValidFile = (file: File): boolean => {
    const validTypes = ['text/csv', 'application/pdf', 'application/vnd.ms-excel'];
    const validExtensions = ['.csv', '.pdf'];
    
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

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            Upload your bank statement to automatically import and categorize
            transactions
          </p>
        </div>

        {/* Upload Area */}
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
                  accept=".csv,.pdf"
                  onChange={handleFileSelect}
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" asChild>
                    <span className="cursor-pointer">Browse Files</span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-4">
                  Supported formats: CSV, PDF
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
                      onClick={removeFile}
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
                      <span className="text-muted-foreground">Uploading...</span>
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
                {uploadMutation.isSuccess && (
                  <div className="flex items-center gap-2 text-income">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Upload complete!</span>
                  </div>
                )}

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
                    onClick={removeFile}
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
                        Upload
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
                  Download your bank statement in CSV or PDF format from your
                  bank's website
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  2
                </span>
                <span>
                  Upload the file using the drop zone above or by clicking
                  "Browse Files"
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  3
                </span>
                <span>
                  Our system will automatically parse and categorize your
                  transactions
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  4
                </span>
                <span>
                  Review your imported transactions in the Expenses page
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Upload;
