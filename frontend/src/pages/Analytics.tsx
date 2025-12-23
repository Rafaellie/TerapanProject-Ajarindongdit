import { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  BarChart3,
  AlertTriangle,
  Zap,
  Loader2, // Import icon loading
  RefreshCw
} from 'lucide-react';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { apiGet } from '@/lib/api'; // Pastikan import helper API Anda
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
import { parseISO, format, subDays, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function Analytics() {
  const { transactions } = useFinanceStore();
  
  // State untuk data AI
  const [aiData, setAiData] = useState<{
    predictions: any[];
    recommendations: any[];
    historical: any[];
  } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // --- 1. Fetch Data AI dari Backend ---
  const fetchAIInsights = async () => {
    setIsLoadingAI(true);
    try {
      const data = await apiGet('/analytics/ai-insights');
      setAiData(data);
      toast.success("AI Insights updated!");
    } catch (error) {
      console.error("AI Error:", error);
      toast.error("Gagal memuat analisis AI");
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Load AI data pertama kali mount
  useEffect(() => {
    fetchAIInsights();
  }, []);

  // --- 2. Existing Logic for Charts (Tetap pakai logic frontend untuk historical chart karena cepat) ---
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
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // --- 3. Prepare Chart Data (Gabungan Historical + AI Prediction) ---
  const predictionChartData = useMemo(() => {
    if (!aiData) return [];

    // Format historical data
    const history = aiData.historical.map((h: any) => ({
      date: format(parseISO(h.date), 'MMM dd'),
      actual: h.amount,
      predicted: null
    }));

    // Format predicted data
    const future = aiData.predictions.map((p: any) => ({
      date: format(parseISO(p.date), 'MMM dd'),
      actual: null,
      predicted: p.predicted_amount
    }));

    // Sambungkan titik terakhir history ke titik pertama prediksi agar grafik nyambung
    if (history.length > 0 && future.length > 0) {
        const lastHistory = history[history.length - 1];
        // Tambahkan titik dummy di awal array future yang nilainya sama dengan history terakhir
        // tapi ada di property predicted agar garisnya nyambung
        future.unshift({
            date: lastHistory.date,
            actual: null,
            predicted: lastHistory.actual
        });
    }

    return [...history, ...future];
  }, [aiData]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Analytics</h1>
          <p className="mt-1 text-muted-foreground">AI-powered insights (Llama 3 via Groq)</p>
        </div>
        <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAIInsights} 
            disabled={isLoadingAI}
        >
            {isLoadingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh AI Analysis
        </Button>
      </div>

      {/* AI Recommendations Section */}
      {isLoadingAI && !aiData ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => (
                <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/50" />
            ))}
          </div>
      ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {aiData?.recommendations.map((rec, index) => (
              <div
                key={index}
                className={cn(
                  'stat-card border-l-4 transition-all hover:shadow-md',
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
            {(!aiData?.recommendations || aiData.recommendations.length === 0) && (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                    No recommendations available. Try adding more transaction data.
                </div>
            )}
          </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales By Category (Historical) */}
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
                  tickFormatter={(value) => `Rp${value/1000}k`}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={100}
                />
                <Tooltip
                  cursor={{fill: 'transparent'}}
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
                    color: "#ffffff",
                  }}
                  itemStyle={{
                    color: "#ffffff",
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

      {/* AI Sales Prediction Chart */}
      <div className="stat-card">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">AI Sales Forecast</h3>
                {isLoadingAI && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground">
                {aiData ? "Prediction based on Llama 3 analysis of historical patterns" : "Loading AI model..."}
            </p>
          </div>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="h-72">
            {!aiData && isLoadingAI ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                    Analyzing historical data...
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={predictionChartData}>
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
                        tickFormatter={(value) => `Rp${value/1000}k`}
                    />
                    <Tooltip
                        contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => [
                            value ? formatCurrency(value) : '-', 
                            name === 'predicted' ? 'Predicted Sales' : 'Actual Sales'
                        ]}
                    />
                    <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                        name="Actual Sales"
                        connectNulls={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="hsl(var(--warning))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: 'hsl(var(--warning))', r: 4 }}
                        name="predicted"
                        connectNulls={true} 
                    />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
      </div>

       {/* Category Performance Table */}
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