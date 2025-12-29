import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Transaction, Product, RawMaterial } from "@/types/finance";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

interface FinanceStore {
  transactions: Transaction[];
  products: Product[];
  rawMaterials: RawMaterial[];

  loadProducts: () => Promise<void>;
  addProduct: (product: FormData | Omit<Product, "id" | "createdAt">) => Promise<void>;
  updateProduct: (id: string, product: FormData | Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  loadRawMaterials: () => Promise<void>;
  addRawMaterial: (material: FormData | any) => Promise<void>;
  updateRawMaterial: (id: string, material: FormData | any) => Promise<void>;
  deleteRawMaterial: (id: string) => Promise<void>;

  loadTransactions: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  importTransactions: (transactions: any[]) => Promise<void>;
  loadDummyData: () => void;
  clearAllData: () => void;
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      products: [],
      rawMaterials: [],

      loadProducts: async () => {
        const data = await apiGet("/products");
        set({ products: data });
      },

      addProduct: async (productData) => {
        const newProduct = await apiPost("/products", productData);
        set((state) => ({
          products: [newProduct, ...state.products],
        }));
      },

      updateProduct: async (id, productData) => {
        const updated = await apiPut(`/products/${id}`, productData);
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? updated : p)),
        }));
      },

      deleteProduct: async (id) => {
        await apiDelete(`/products/${id}`);
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
      },

      loadTransactions: async () => {
        const data = await apiGet("/transactions");
        set({ transactions: data });
      },

      addTransaction: async (transactionData) => {
        const newTransaction = await apiPost("/transactions", transactionData);
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
        }));
      },

      updateTransaction: async (id, transactionData) => {
        const updated = await apiPut(`/transactions/${id}`, transactionData);
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? updated : t
          ),
        }));
      },

      deleteTransaction: async (id) => {
        await apiDelete(`/transactions/${id}`);
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      loadRawMaterials: async () => {
        const data = await apiGet("/raw-materials");
        set({ rawMaterials: data });
      },

      addRawMaterial: async (materialData) => {
        const newMaterial = await apiPost("/raw-materials", materialData);
        set((state) => ({
          rawMaterials: [newMaterial, ...state.rawMaterials],
        }));
      },

      updateRawMaterial: async (id, material) => {
        const updated = await apiPut(`/raw-materials/${id}`, material);
        set((state) => ({
          rawMaterials: state.rawMaterials.map((m) =>
            m.id === id ? updated : m
          ),
        }));
      },

      deleteRawMaterial: async (id) => {
        await apiDelete(`/raw-materials/${id}`);
        set((state) => ({
          rawMaterials: state.rawMaterials.filter((m) => m.id !== id),
        }));
      },

      importTransactions: async (transactions) => {
        try {
          await apiPost("/transactions/imp", transactions);
          
          const currentStore = get();
          await currentStore.loadTransactions();
          
        } catch (error) {
          console.error("Import failed:", error);
          throw error; 
        }
      },
      loadDummyData: () =>
        set({ transactions: [], products: [], rawMaterials: [] }),
      clearAllData: () =>
        set({ transactions: [], products: [], rawMaterials: [] }),
    }),
    {
      name: "finance-store",
    }
  )
);
