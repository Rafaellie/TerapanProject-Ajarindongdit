import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction, Product, RawMaterial } from '@/types/finance';
import { dummyTransactions, dummyProducts, dummyRawMaterials } from '@/data/dummyData';

interface FinanceStore {
  transactions: Transaction[];
  products: Product[];
  rawMaterials: RawMaterial[];
  
  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Raw Material actions
  addRawMaterial: (material: Omit<RawMaterial, 'id' | 'createdAt'>) => void;
  updateRawMaterial: (id: string, material: Partial<RawMaterial>) => void;
  deleteRawMaterial: (id: string) => void;
  
  // Bulk actions
  importTransactions: (transactions: Transaction[]) => void;
  loadDummyData: () => void;
  clearAllData: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set) => ({
      transactions: dummyTransactions,
      products: dummyProducts,
      rawMaterials: dummyRawMaterials,
      
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            { ...transaction, id: generateId(), createdAt: new Date().toISOString() },
            ...state.transactions,
          ],
        })),
      
      updateTransaction: (id, transaction) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...transaction } : t
          ),
        })),
      
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
      
      addProduct: (product) =>
        set((state) => ({
          products: [
            { ...product, id: generateId(), createdAt: new Date().toISOString() },
            ...state.products,
          ],
        })),
      
      updateProduct: (id, product) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...product } : p
          ),
        })),
      
      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),
      
      addRawMaterial: (material) =>
        set((state) => ({
          rawMaterials: [
            { ...material, id: generateId(), createdAt: new Date().toISOString() },
            ...state.rawMaterials,
          ],
        })),
      
      updateRawMaterial: (id, material) =>
        set((state) => ({
          rawMaterials: state.rawMaterials.map((m) =>
            m.id === id ? { ...m, ...material } : m
          ),
        })),
      
      deleteRawMaterial: (id) =>
        set((state) => ({
          rawMaterials: state.rawMaterials.filter((m) => m.id !== id),
        })),
      
      importTransactions: (transactions) =>
        set((state) => ({
          transactions: [...transactions, ...state.transactions],
        })),
      
      loadDummyData: () =>
        set({
          transactions: dummyTransactions,
          products: dummyProducts,
          rawMaterials: dummyRawMaterials,
        }),
      
      clearAllData: () =>
        set({
          transactions: [],
          products: [],
          rawMaterials: [],
        }),
    }),
    {
      name: 'finance-store',
    }
  )
);
