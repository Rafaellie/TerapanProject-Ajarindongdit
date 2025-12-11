import { useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { startOfMonth, isWithinInterval, parseISO, subMonths } from 'date-fns';

export default function Dashboard() {
  const { transactions } = useFinanceStore();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = startOfMonth(now);

    const currentMonthTransactions = transactions.filter((t) =>
      isWithinInterval(parseISO(t.date), { start: currentMonthStart, end: now })
    );

    const lastMonthTransactions = transactions.filter((t) =>
      isWithinInterval(parseISO(t.date), { start: lastMonthStart, end: lastMonthEnd })
    );

    const currentIncome = currentMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentExpense = currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastIncome = lastMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastExpense = lastMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
    const expenseChange = lastExpense > 0 ? ((currentExpense - lastExpense) / lastExpense) * 100 : 0;
    const netProfit = currentIncome - currentExpense;
    const lastNetProfit = lastIncome - lastExpense;
    const profitChange = lastNetProfit !== 0 ? ((netProfit - lastNetProfit) / Math.abs(lastNetProfit)) * 100 : 0;

    return {
      totalIncome: currentIncome,
      totalExpense: currentExpense,
      netProfit,
      transactionCount: currentMonthTransactions.length,
      incomeChange,
      expenseChange,
      profitChange,
    };
  }, [transactions]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back! Here's your financial overview for this month.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Income"
          value={stats.totalIncome}
          change={stats.incomeChange}
          icon={TrendingUp}
          variant="income"
        />
        <StatCard
          title="Total Expenses"
          value={stats.totalExpense}
          change={stats.expenseChange}
          icon={TrendingDown}
          variant="expense"
        />
        <StatCard
          title="Net Profit"
          value={stats.netProfit}
          change={stats.profitChange}
          icon={DollarSign}
          variant={stats.netProfit >= 0 ? 'income' : 'expense'}
        />
        <StatCard
          title="Transactions"
          value={stats.transactionCount}
          icon={Activity}
          variant="neutral"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <CategoryChart />
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactions />
        </div>
        <LowStockAlert />
      </div>
    </div>
  );
}
