import { Transaction, Product, RawMaterial } from '@/types/finance';

const generateId = () => Math.random().toString(36).substr(2, 9);

const incomeCategories = ['Coffee Sales', 'Tea Sales', 'Juice Sales', 'Snacks', 'Merchandise'];
const expenseCategories = ['Raw Materials', 'Electricity', 'Rent', 'Salaries', 'Equipment', 'Marketing', 'Supplies'];

const productNames = [
  'Espresso', 'Americano', 'Cappuccino', 'Latte', 'Mocha',
  'Green Tea', 'Black Tea', 'Matcha Latte', 'Chai Latte',
  'Orange Juice', 'Apple Juice', 'Mango Smoothie', 'Berry Smoothie',
  'Croissant', 'Muffin', 'Sandwich', 'Cake Slice'
];

const rawMaterialNames = [
  'Coffee Beans', 'Milk', 'Sugar', 'Tea Leaves', 'Orange', 'Apple',
  'Mango', 'Berries', 'Flour', 'Butter', 'Eggs', 'Chocolate'
];

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

export function generateTransactions(count: number = 100): Transaction[] {
  const transactions: Transaction[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  for (let i = 0; i < count; i++) {
    const isIncome = Math.random() > 0.35;
    const categories = isIncome ? incomeCategories : expenseCategories;
    
    transactions.push({
      id: generateId(),
      type: isIncome ? 'income' : 'expense',
      amount: isIncome ? randomAmount(5, 150) : randomAmount(20, 500),
      category: categories[Math.floor(Math.random() * categories.length)],
      description: isIncome 
        ? `Sale - ${productNames[Math.floor(Math.random() * productNames.length)]}`
        : `Purchase - ${expenseCategories[Math.floor(Math.random() * expenseCategories.length)]}`,
      date: randomDate(startDate, endDate),
      createdAt: new Date().toISOString(),
    });
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function generateProducts(): Product[] {
  const categories = ['Coffee', 'Tea', 'Juice', 'Snacks'];
  
  return productNames.map((name, index) => ({
    id: generateId(),
    name,
    price: randomAmount(3, 15),
    cost: randomAmount(1, 5),
    category: categories[Math.floor(index / 5)] || 'Other',
    stock: Math.floor(Math.random() * 100) + 10,
    minStock: 10,
    unit: 'pcs',
    createdAt: new Date().toISOString(),
  }));
}

export function generateRawMaterials(): RawMaterial[] {
  const suppliers = ['Supplier A', 'Supplier B', 'Supplier C', 'Local Market'];
  const units = ['kg', 'L', 'pcs', 'box'];
  
  return rawMaterialNames.map(name => ({
    id: generateId(),
    name,
    price: randomAmount(5, 50),
    stock: Math.floor(Math.random() * 50) + 5,
    minStock: 10,
    unit: units[Math.floor(Math.random() * units.length)],
    supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
    createdAt: new Date().toISOString(),
  }));
}

export const dummyTransactions = generateTransactions(150);
export const dummyProducts = generateProducts();
export const dummyRawMaterials = generateRawMaterials();
