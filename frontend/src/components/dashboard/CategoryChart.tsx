import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useFinanceStore } from "@/hooks/useFinanceStore";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-income))", "hsl(var(--chart-expense))"];

export function CategoryChart() {
  const { transactions } = useFinanceStore();

  const expenseByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();

    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + t.amount);
      });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [transactions]);

  return (
    <div className="stat-card animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Expense Categories</h3>
        <p className="text-sm text-muted-foreground">Breakdown by category</p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
              {expenseByCategory.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "#ffffff", // Mengubah warna teks default container
              }}
              itemStyle={{
                color: "#ffffff",
              }}
              formatter={(value: number) => [`Rp${value.toLocaleString('id-ID')}`, "Amount"]}
            />
            <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: "hsl(var(--foreground))", fontSize: "12px" }}>{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
