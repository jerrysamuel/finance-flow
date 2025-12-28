import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import ExpenseItem from '@/components/ExpenseItem';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { analyticsAPI, expensesAPI, Expense } from '@/lib/api';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Receipt,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Dashboard: React.FC = () => {
  // Fetch analytics summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const response = await analyticsAPI.getSummary();
      return response.data;
    },
  });

  // Fetch monthly data
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['analytics', 'monthly'],
    queryFn: async () => {
      const response = await analyticsAPI.getByMonth({ months: 6 });
      return response.data;
    },
  });

  // Fetch recent expenses
  const { data: recentExpenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', 'recent'],
    queryFn: async () => {
      const response = await expensesAPI.getAll({ page: 1 });
      return response.data?.results || response.data || [];
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Mock data for chart when no data
  const chartData = monthlyData?.length ? monthlyData : [
    { month: 'Jan', income: 0, expenses: 0 },
    { month: 'Feb', income: 0, expenses: 0 },
    { month: 'Mar', income: 0, expenses: 0 },
    { month: 'Apr', income: 0, expenses: 0 },
    { month: 'May', income: 0, expenses: 0 },
    { month: 'Jun', income: 0, expenses: 0 },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's your financial overview.
            </p>
          </div>
          <Link to="/expenses">
            <Button>
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        {summaryLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SkeletonLoader type="card" count={4} />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Net Balance"
              value={summary?.net_balance || 0}
              type="balance"
              icon={<Wallet className="h-5 w-5" />}
            />
            <StatCard
              title="Total Income"
              value={summary?.total_income || 0}
              subtitle="Credits"
              type="income"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              title="Total Expenses"
              value={summary?.total_expenses || 0}
              subtitle="Debits"
              type="expense"
              icon={<TrendingDown className="h-5 w-5" />}
            />
            <StatCard
              title="Transactions"
              value={summary?.total_transactions || 0}
              subtitle="All time"
              icon={<Receipt className="h-5 w-5" />}
            />
          </div>
        )}

        {/* Chart Section */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 card-elevated p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Income vs Expenses</h2>
              <Link to="/analytics">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {monthlyLoading ? (
              <div className="h-64 skeleton-shimmer rounded-lg" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--income))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--income))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--expense))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--expense))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="month"
                      className="text-xs fill-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      className="text-xs fill-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="hsl(var(--income))"
                      fillOpacity={1}
                      fill="url(#incomeGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="hsl(var(--expense))"
                      fillOpacity={1}
                      fill="url(#expenseGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-2 card-elevated p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Transactions</h2>
              <Link to="/expenses">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {expensesLoading ? (
              <SkeletonLoader type="list" count={5} />
            ) : recentExpenses && recentExpenses.length > 0 ? (
              <div className="space-y-1">
                {recentExpenses.slice(0, 5).map((expense: Expense) => (
                  <ExpenseItem key={expense.id} expense={expense} />
                ))}
              </div>
            ) : (
              <EmptyState
                type="no-data"
                title="No transactions yet"
                description="Start by adding your first transaction or uploading a bank statement."
                actionLabel="Add Transaction"
                onAction={() => window.location.href = '/expenses'}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
