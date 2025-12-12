import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  BarChart3,
  Clock,
  Package,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { parseISO, format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from "@/lib/formatCurrency";


const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function Analytics() {
  const { transactions, products } = useFinanceStore();

  // Sales trends - top selling products based on income categories
  const salesTrends = useMemo(() => {
    const categoryMap = new Map<string, { current: number; previous: number }>();
    const now = new Date();
    const currentStart = subDays(now, 30);
    const previousStart = subDays(now, 60);
    const previousEnd = subDays(now, 30);

    transactions.forEach((t) => {
      if (t.type !== 'income') return;
      const date = parseISO(t.date);

      if (!categoryMap.has(t.category)) {
        categoryMap.set(t.category, { current: 0, previous: 0 });
      }

      const data = categoryMap.get(t.category)!;
      if (isWithinInterval(date, { start: currentStart, end: now })) {
        data.current += t.amount;
      } else if (isWithinInterval(date, { start: previousStart, end: previousEnd })) {
        data.previous += t.amount;
      }
    });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => {
        const change = data.previous > 0 ? ((data.current - data.previous) / data.previous) * 100 : 0;
        return {
          category,
          revenue: data.current,
          change,
          trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [transactions]);

  // Expense breakdown
  const expenseBreakdown = useMemo(() => {
    const categoryMap = new Map<string, number>();
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    transactions
      .filter((t) => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start: thirtyDaysAgo, end: now }))
      .forEach((t) => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + t.amount);
      });

    const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: ((value / total) * 100).toFixed(1),
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Sales prediction (simple moving average)
  const salesPrediction = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(new Date(), 13 - i);
      return {
        date: format(date, 'MMM dd'),
        fullDate: startOfDay(date),
        actual: 0,
        predicted: null as number | null,
      };
    });

    // Calculate actual sales for past 14 days
    transactions.forEach((t) => {
      if (t.type !== 'income') return;
      const transactionDate = startOfDay(parseISO(t.date));
      const dayData = last14Days.find(
        (d) => d.fullDate.getTime() === transactionDate.getTime()
      );
      if (dayData) {
        dayData.actual += t.amount;
      }
    });

    // Calculate 7-day moving average for prediction
    const predictions = [];
    for (let i = 7; i < 21; i++) {
      const date = subDays(new Date(), 13 - i);
      const pastDays = last14Days.slice(Math.max(0, i - 7), i);
      const avg = pastDays.reduce((sum, d) => sum + d.actual, 0) / pastDays.length;
      predictions.push({
        date: format(date, 'MMM dd'),
        predicted: avg * (1 + Math.random() * 0.1 - 0.05), // Add slight variance
      });
    }

    return [...last14Days.map(d => ({ ...d, predicted: null })), ...predictions];
  }, [transactions]);

  // Recommendations
  const recommendations = useMemo(() => {
    const recs: { type: 'success' | 'warning' | 'info'; title: string; description: string }[] = [];

    // Best selling products
    if (salesTrends.length > 0) {
      const best = salesTrends[0];
      recs.push({
        type: 'success',
        title: 'Top Performer',
        description: `${best.category} is your best-selling category with Rp. ${best.revenue.toFixed(0)} in revenue this month.`,
      });
    }

    // Slow selling products
    if (salesTrends.length > 2) {
      const slowest = salesTrends[salesTrends.length - 1];
      if (slowest.revenue < salesTrends[0].revenue * 0.2) {
        recs.push({
          type: 'warning',
          title: 'Slow Moving Category',
          description: `${slowest.category} has low sales. Consider promotions or reviewing pricing strategy.`,
        });
      }
    }

    // High expense category
    if (expenseBreakdown.length > 0) {
      const highest = expenseBreakdown[0];
      if (parseFloat(highest.percentage) > 40) {
        recs.push({
          type: 'warning',
          title: 'High Expense Alert',
          description: `${highest.name} accounts for ${highest.percentage}% of expenses. Review for optimization opportunities.`,
        });
      }
    }

    // Growth trends
    const growingCategories = salesTrends.filter((s) => s.change > 10);
    if (growingCategories.length > 0) {
      recs.push({
        type: 'info',
        title: 'Growth Opportunity',
        description: `${growingCategories.map((c) => c.category).join(', ')} showing strong growth. Consider increasing inventory.`,
      });
    }

    // Low stock products
    const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
    if (lowStockProducts.length > 0) {
      recs.push({
        type: 'warning',
        title: 'Stock Alert',
        description: `${lowStockProducts.length} products are running low. Restock: ${lowStockProducts.slice(0, 3).map((p) => p.name).join(', ')}.`,
      });
    }

    return recs;
  }, [salesTrends, expenseBreakdown, products]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sales Analytics</h1>
        <p className="mt-1 text-muted-foreground">AI-powered insights and sales predictions</p>
      </div>

      {/* Recommendations */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {recommendations.slice(0, 4).map((rec, index) => (
          <div
            key={index}
            className={cn(
              'stat-card border-l-4',
              rec.type === 'success' && 'border-l-success',
              rec.type === 'warning' && 'border-l-warning',
              rec.type === 'info' && 'border-l-info'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  rec.type === 'success' && 'bg-success/10',
                  rec.type === 'warning' && 'bg-warning/10',
                  rec.type === 'info' && 'bg-info/10'
                )}
              >
                {rec.type === 'success' && <Zap className="h-5 w-5 text-success" />}
                {rec.type === 'warning' && <AlertTriangle className="h-5 w-5 text-warning" />}
                {rec.type === 'info' && <Lightbulb className="h-5 w-5 text-info" />}
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{rec.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{rec.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Trends */}
        <div className="stat-card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Sales by Category</h3>
              <p className="text-sm text-muted-foreground">Last 30 days performance</p>
            </div>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesTrends.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="stat-card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Expense Distribution</h3>
              <p className="text-sm text-muted-foreground">Last 30 days breakdown</p>
            </div>
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {expenseBreakdown.slice(0, 4).map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.name} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Prediction */}
      <div className="stat-card">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Sales Prediction</h3>
            <p className="text-sm text-muted-foreground">Based on historical trends (7-day moving average)</p>
          </div>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesPrediction}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                width={80}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `Rp.${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [value ? formatCurrency(value) : '-', '']}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
                name="Actual Sales"
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'hsl(var(--warning))' }}
                name="Predicted"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Trends Table */}
      <div className="stat-card overflow-hidden p-0">
        <div className="p-6 pb-0">
          <h3 className="text-lg font-semibold text-foreground">Category Performance</h3>
          <p className="text-sm text-muted-foreground">30-day revenue with trend analysis</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Revenue</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Change</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">Trend</th>
              </tr>
            </thead>
            <tbody>
              {salesTrends.map((item) => (
                <tr key={item.category} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{item.category}</td>
                  <td className="px-6 py-4 text-right text-sm text-foreground">
                    {formatCurrency(item.revenue)}
                  </td>
                  <td
                    className={cn(
                      'px-6 py-4 text-right text-sm font-medium',
                      item.change > 0 ? 'text-success' : item.change < 0 ? 'text-destructive' : 'text-muted-foreground'
                    )}
                  >
                    {item.change > 0 ? '+' : ''}
                    {item.change.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.trend === 'up' && <TrendingUp className="mx-auto h-5 w-5 text-success" />}
                    {item.trend === 'down' && <TrendingDown className="mx-auto h-5 w-5 text-destructive" />}
                    {item.trend === 'stable' && <div className="mx-auto h-0.5 w-4 bg-muted-foreground" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
