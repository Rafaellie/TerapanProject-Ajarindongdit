export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  productId?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  createdAt: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
  supplier: string;
  createdAt: string;
}

export interface DailyReport {
  date: string;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  transactionCount: number;
}

export interface MonthlyReport {
  month: string;
  year: number;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  dailyAverage: number;
}

export interface SalesTrend {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface SalesPrediction {
  date: string;
  predictedRevenue: number;
  confidence: number;
}

export type FilterPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}
