import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import { analyticsAPI, CategoryData, MonthlyData } from '@/lib/api';
import { TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const CHART_COLORS = [
  'hsl(168, 76%, 36%)',
  'hsl(152, 69%, 41%)',
  'hsl(197, 71%, 52%)',
  'hsl(43, 96%, 56%)',
  'hsl(280, 68%, 55%)',
  'hsl(4, 90%, 58%)',
];

const Analytics: React.FC = () => {
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
      const response = await analyticsAPI.getMonthly();
      return response.data || [];
    },
  });

  // Fetch category data
  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ['analytics', 'categories'],
    queryFn: async () => {
      const response = await analyticsAPI.getByCategories();
      return response.data || [];
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

  // Prepare chart data with colors
  const pieChartData = categoryData?.map((item: CategoryData, index: number) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  const isLoading = summaryLoading || monthlyLoading || categoryLoading;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights into your spending patterns
          </p>
        </div>

        {/* Summary Stats */}
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
              type="income"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              title="Total Expenses"
              value={summary?.total_expenses || 0}
              type="expense"
              icon={<TrendingDown className="h-5 w-5" />}
            />
            <StatCard
              title="Savings Rate"
              value={
                summary?.total_income
                  ? `${Math.round(((summary.total_income - summary.total_expenses) / summary.total_income) * 100)}%`
                  : '0%'
              }
              icon={<PieChart className="h-5 w-5" />}
            />
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Trend */}
          <div className="card-elevated p-6">
            <h2 className="text-lg font-semibold mb-6">Monthly Trend</h2>
            {monthlyLoading ? (
              <div className="h-72 skeleton-shimmer rounded-lg" />
            ) : monthlyData && monthlyData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
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
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="hsl(var(--income))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--income))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="hsl(var(--expense))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--expense))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                No monthly data available
              </div>
            )}
          </div>

          {/* Spending by Category */}
          <div className="card-elevated p-6">
            <h2 className="text-lg font-semibold mb-6">Spending by Category</h2>
            {categoryLoading ? (
              <div className="h-72 skeleton-shimmer rounded-lg" />
            ) : pieChartData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {pieChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                No category data available
              </div>
            )}
          </div>

          {/* Monthly Comparison Bar Chart */}
          <div className="card-elevated p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-6">Income vs Expenses</h2>
            {monthlyLoading ? (
              <div className="h-72 skeleton-shimmer rounded-lg" />
            ) : monthlyData && monthlyData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
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
                    <Legend />
                    <Bar
                      dataKey="income"
                      fill="hsl(var(--income))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expenses"
                      fill="hsl(var(--expense))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                No data available. Add some transactions to see your analytics.
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Table */}
        {categoryData && categoryData.length > 0 && (
          <div className="card-elevated p-6">
            <h2 className="text-lg font-semibold mb-6">Category Breakdown</h2>
            <div className="space-y-4">
              {pieChartData.map((category: any, index: number) => (
                <div key={category.category} className="flex items-center gap-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{category.category}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(category.amount)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {category.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
