import { useMemo, useState } from 'react';
import { FileDown, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import {
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfMonth,
  endOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
  isWithinInterval,
  subMonths,
} from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

type ReportPeriod = 'daily' | 'monthly' | 'yearly';

export default function Reports() {
  const { transactions } = useFinanceStore();
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const reportData = useMemo(() => {
    const now = new Date();

    if (period === 'daily') {
      const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`));
      const monthEnd = endOfMonth(monthStart);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

      return days.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        const dayTransactions = transactions.filter((t) =>
          isWithinInterval(parseISO(t.date), { start: dayStart, end: dayEnd })
        );

        const income = dayTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = dayTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          date: format(day, 'MMM dd'),
          fullDate: format(day, 'yyyy-MM-dd'),
          income,
          expense,
          profit: income - expense,
          transactions: dayTransactions.length,
        };
      });
    }

    if (period === 'monthly') {
      const yearStart = startOfYear(now);
      const months = eachMonthOfInterval({ start: yearStart, end: now });

      return months.map((month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthTransactions = transactions.filter((t) =>
          isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
        );

        const income = monthTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          date: format(month, 'MMM'),
          fullDate: format(month, 'yyyy-MM'),
          income,
          expense,
          profit: income - expense,
          transactions: monthTransactions.length,
        };
      });
    }

    // Yearly - last 3 years
    const years = [2, 1, 0].map((yearsAgo) => {
      const year = new Date().getFullYear() - yearsAgo;
      const yearStart = startOfYear(new Date(year, 0, 1));
      const yearEnd = endOfYear(yearStart);
      const yearTransactions = transactions.filter((t) =>
        isWithinInterval(parseISO(t.date), { start: yearStart, end: yearEnd })
      );

      const income = yearTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = yearTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        date: year.toString(),
        fullDate: year.toString(),
        income,
        expense,
        profit: income - expense,
        transactions: yearTransactions.length,
      };
    });

    return years;
  }, [transactions, period, selectedMonth]);

  const totals = useMemo(() => {
    return reportData.reduce(
      (acc, item) => ({
        income: acc.income + item.income,
        expense: acc.expense + item.expense,
        profit: acc.profit + item.profit,
        transactions: acc.transactions + item.transactions,
      }),
      { income: 0, expense: 0, profit: 0, transactions: 0 }
    );
  }, [reportData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      reportData.map((item) => ({
        Date: item.fullDate,
        Income: item.income,
        Expense: item.expense,
        'Net Profit': item.profit,
        Transactions: item.transactions,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `financial-report-${period}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Report exported to Excel');
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(
      reportData.map((item) => ({
        Date: item.fullDate,
        Income: item.income,
        Expense: item.expense,
        'Net Profit': item.profit,
        Transactions: item.transactions,
      }))
    );
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Report exported to CSV');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Financial Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`, 14, 32);
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy')}`, 14, 38);

    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Income', 'Expense', 'Net Profit', 'Transactions']],
      body: reportData.map((item) => [
        item.fullDate,
        formatCurrency(item.income),
        formatCurrency(item.expense),
        formatCurrency(item.profit),
        item.transactions.toString(),
      ]),
      foot: [
        [
          'TOTAL',
          formatCurrency(totals.income),
          formatCurrency(totals.expense),
          formatCurrency(totals.profit),
          totals.transactions.toString(),
        ],
      ],
    });

    doc.save(`financial-report-${period}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('Report exported to PDF');
  };

  const monthOptions = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      months.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy'),
      });
    }
    return months;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Reports</h1>
          <p className="mt-1 text-muted-foreground">Generate and export financial summaries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <FileDown className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <FileDown className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button onClick={exportToPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={period} onValueChange={(v: ReportPeriod) => setPeriod(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>

        {period === 'daily' && (
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-xl font-bold text-success">{formatCurrency(totals.income)}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-xl font-bold text-destructive">{formatCurrency(totals.expense)}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className={`text-xl font-bold ${totals.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(totals.profit)}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
              <Calendar className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-xl font-bold text-foreground">{totals.transactions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="stat-card">
        <h3 className="mb-6 text-lg font-semibold text-foreground">Revenue vs Expenses</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData}>
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
                tickFormatter={(value) => `Rp. ${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [formatCurrency(value), '']}
              />
              <Legend />
              <Bar dataKey="income" name="Income" fill="hsl(var(--chart-income))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="hsl(var(--chart-expense))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="stat-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Income</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Expenses</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Net Profit</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item, index) => (
                <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{item.date}</td>
                  <td className="px-4 py-3 text-right text-sm text-success">{formatCurrency(item.income)}</td>
                  <td className="px-4 py-3 text-right text-sm text-destructive">{formatCurrency(item.expense)}</td>
                  <td className={`px-4 py-3 text-right text-sm font-medium ${item.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(item.profit)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">{item.transactions}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 font-medium">
                <td className="px-4 py-3 text-sm text-foreground">Total</td>
                <td className="px-4 py-3 text-right text-sm text-success">{formatCurrency(totals.income)}</td>
                <td className="px-4 py-3 text-right text-sm text-destructive">{formatCurrency(totals.expense)}</td>
                <td className={`px-4 py-3 text-right text-sm ${totals.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(totals.profit)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-foreground">{totals.transactions}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
