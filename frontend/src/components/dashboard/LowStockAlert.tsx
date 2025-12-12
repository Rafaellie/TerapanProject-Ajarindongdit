import { useFinanceStore } from '@/hooks/useFinanceStore';
import { AlertTriangle, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function LowStockAlert() {
  const { products, rawMaterials } = useFinanceStore();

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const lowStockMaterials = rawMaterials.filter((m) => m.stock <= m.minStock);

  const totalAlerts = lowStockProducts.length + lowStockMaterials.length;

  let targetPath = "/inventory"; 

  if (lowStockProducts.length > 0 && lowStockMaterials.length === 0) {
    targetPath = "/products";
  } else if (lowStockMaterials.length > 0 && lowStockProducts.length === 0) {
    targetPath = "/inventory";
  } else if (lowStockProducts.length > 0 && lowStockMaterials.length > 0) {
    targetPath = "/inventory"; 
  }

  if (totalAlerts === 0) {
    return (
      <div className="stat-card animate-slide-up">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <Package className="h-6 w-6 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">All Stock Levels OK</h3>
            <p className="text-sm text-muted-foreground">No items need restocking</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card animate-slide-up border-warning/30 bg-warning/5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Low Stock Alert</h3>
            <p className="text-sm text-muted-foreground">{totalAlerts} items need attention</p>
          </div>
        </div>
        <Link to={targetPath}>
          <Button variant="outline" size="sm">
            Manage
          </Button>
        </Link>
      </div>
      <div className="space-y-2">
        {lowStockProducts.slice(0, 3).map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between rounded-lg bg-background/50 p-2 text-sm"
          >
            <span className="text-foreground">{product.name}</span>
            <span className="font-medium text-warning">
              {product.stock} {product.unit}
            </span>
          </div>
        ))}
        {lowStockMaterials.slice(0, 3).map((material) => (
          <div
            key={material.id}
            className="flex items-center justify-between rounded-lg bg-background/50 p-2 text-sm"
          >
            <span className="text-foreground">{material.name}</span>
            <span className="font-medium text-warning">
              {material.stock} {material.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
