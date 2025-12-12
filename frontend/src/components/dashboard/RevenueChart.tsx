import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { format, subDays, parseISO, startOfDay } from 'date-fns';
import { formatCurrency } from "@/lib/formatCurrency";

export function RevenueChart() {
  const { transactions } = useFinanceStore();

  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, 'MMM dd'),
        fullDate: startOfDay(date).toISOString(),
        income: 0,
        expense: 0,
      };
    });

    transactions.forEach((t) => {
      const transactionDate = startOfDay(parseISO(t.date)).toISOString();
      const dayData = last30Days.find((d) => d.fullDate === transactionDate);
      if (dayData) {
        if (t.type === 'income') {
          dayData.income += t.amount;
        } else {
          dayData.expense += t.amount;
        }
      }
    });

    return last30Days;
  }, [transactions]);

  return (
    <div className="stat-card animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Revenue Overview</h3>
        <p className="text-sm text-muted-foreground">Last 30 days performance</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 25, bottom: 10 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-income))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-income))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-expense))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-expense))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value)}
              domain={['auto', 'auto']} 
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="hsl(var(--chart-income))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#incomeGradient)"
              name="Income"
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="hsl(var(--chart-expense))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#expenseGradient)"
              name="Expense"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
