import { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, Trash2, FileSpreadsheet, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function DataManagement() {
  const { transactions, products, rawMaterials, importTransactions, loadDummyData, clearAllData, loadTransactions } =
    useFinanceStore();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

      const formattedForBackend = jsonData.map((row: any) => ({
        type: row.type?.toLowerCase() === 'expense' ? 'expense' : 'income',
        amount: parseFloat(row.amount) || 0,
        category: row.category || 'Uncategorized',
        description: row.description || '',
        date: row.date ? new Date(row.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      }));

      await importTransactions(formattedForBackend);
      
      toast.success(`Successfully imported ${formattedForBackend.length} transactions`);
      
      loadTransactions(); 

    } catch (error) {
      toast.error('Failed to import file. Check format or server connection.');
      console.error(error);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const exportTransactions = () => {
    const ws = XLSX.utils.json_to_sheet(
      transactions.map((t) => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: t.date,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `transactions-backup-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Transactions exported successfully');
  };

  const exportProducts = () => {
    const ws = XLSX.utils.json_to_sheet(
      products.map((p) => ({
        name: p.name,
        price: p.price,
        cost: p.cost,
        category: p.category,
        stock: p.stock,
        minStock: p.minStock,
        unit: p.unit,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, `products-backup-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Products exported successfully');
  };

  const exportMaterials = () => {
    const ws = XLSX.utils.json_to_sheet(
      rawMaterials.map((m) => ({
        name: m.name,
        price: m.price,
        stock: m.stock,
        minStock: m.minStock,
        unit: m.unit,
        supplier: m.supplier,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Materials');
    XLSX.writeFile(wb, `materials-backup-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Materials exported successfully');
  };

  const exportAllData = () => {
    const wb = XLSX.utils.book_new();

    // Transactions sheet
    const transactionsWs = XLSX.utils.json_to_sheet(
      transactions.map((t) => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: t.date,
      }))
    );
    XLSX.utils.book_append_sheet(wb, transactionsWs, 'Transactions');

    // Products sheet
    const productsWs = XLSX.utils.json_to_sheet(
      products.map((p) => ({
        name: p.name,
        price: p.price,
        cost: p.cost,
        category: p.category,
        stock: p.stock,
        minStock: p.minStock,
        unit: p.unit,
      }))
    );
    XLSX.utils.book_append_sheet(wb, productsWs, 'Products');

    // Materials sheet
    const materialsWs = XLSX.utils.json_to_sheet(
      rawMaterials.map((m) => ({
        name: m.name,
        price: m.price,
        stock: m.stock,
        minStock: m.minStock,
        unit: m.unit,
        supplier: m.supplier,
      }))
    );
    XLSX.utils.book_append_sheet(wb, materialsWs, 'Materials');

    XLSX.writeFile(wb, `full-backup-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Full backup exported successfully');
  };

  const handleLoadDummyData = () => {
    loadDummyData();
    toast.success('Dummy data loaded successfully');
  };

  const handleClearAllData = () => {
    clearAllData();
    setClearDialogOpen(false);
    toast.success('All data cleared successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Management</h1>
        <p className="mt-1 text-muted-foreground">Import, export, and manage your data</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
              <p className="text-sm text-muted-foreground">Transactions</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
              <Database className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{products.length}</p>
              <p className="text-sm text-muted-foreground">Products</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
              <Database className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{rawMaterials.length}</p>
              <p className="text-sm text-muted-foreground">Raw Materials</p>
            </div>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="stat-card">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Import Data</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Import transactions from Excel or CSV files. The file should have columns: type, amount,
          category, description, date.
        </p>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
        />
        <Button onClick={handleImportClick}>
          <Upload className="mr-2 h-4 w-4" />
          Import from Excel/CSV
        </Button>
      </div>

      {/* Export Section */}
      <div className="stat-card">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Export Data</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Export your data to Excel files for backup or analysis in other tools.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={exportTransactions}>
            <Download className="mr-2 h-4 w-4" />
            Export Transactions
          </Button>
          <Button variant="outline" onClick={exportProducts}>
            <Download className="mr-2 h-4 w-4" />
            Export Products
          </Button>
          <Button variant="outline" onClick={exportMaterials}>
            <Download className="mr-2 h-4 w-4" />
            Export Materials
          </Button>
          <Button onClick={exportAllData}>
            <Download className="mr-2 h-4 w-4" />
            Full Backup
          </Button>
        </div>
      </div>

      {/* Test Data Section */}
      <div className="stat-card">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Test Data</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Load sample data for testing or clear all data to start fresh.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleLoadDummyData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Load Dummy Data
          </Button>
          <Button variant="destructive" onClick={() => setClearDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All Data
          </Button>
        </div>
      </div>

      {/* Import Template Info */}
      <div className="stat-card border-primary/30 bg-primary/5">
        <h3 className="mb-2 text-lg font-semibold text-foreground">Import Template</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Your Excel/CSV file should have the following columns:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-medium text-foreground">Column</th>
                <th className="px-3 py-2 text-left font-medium text-foreground">Description</th>
                <th className="px-3 py-2 text-left font-medium text-foreground">Example</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">type</td>
                <td className="px-3 py-2 text-muted-foreground">income or expense</td>
                <td className="px-3 py-2 text-muted-foreground">income</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">amount</td>
                <td className="px-3 py-2 text-muted-foreground">Transaction amount</td>
                <td className="px-3 py-2 text-muted-foreground">150.50</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">category</td>
                <td className="px-3 py-2 text-muted-foreground">Category name</td>
                <td className="px-3 py-2 text-muted-foreground">Coffee Sales</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">description</td>
                <td className="px-3 py-2 text-muted-foreground">Transaction details</td>
                <td className="px-3 py-2 text-muted-foreground">Daily coffee sales</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">date</td>
                <td className="px-3 py-2 text-muted-foreground">YYYY-MM-DD format</td>
                <td className="px-3 py-2 text-muted-foreground">2024-01-15</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Clear Data Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all data? This will permanently delete all transactions,
              products, and raw materials. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
