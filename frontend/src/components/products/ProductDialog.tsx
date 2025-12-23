import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/types/finance';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { toast } from 'sonner';
import { Camera, Package, X } from 'lucide-react';

const categories = ['Coffee', 'Tea', 'Juice', 'Snacks', 'Merchandise', 'Other'];

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const { addProduct, updateProduct } = useFinanceStore();
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('10');
  const [unit, setUnit] = useState('pcs');
  
  // State untuk preview (URL string)
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  // State untuk file asli (File object)
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price.toString());
      setCost(product.cost.toString());
      setCategory(product.category);
      setStock(product.stock.toString());
      setMinStock(product.minStock.toString());
      setUnit(product.unit);
      // Gunakan URL dari backend untuk preview
      setImagePreview(product.image); 
      setImageFile(null); // Reset file baru saat buka mode edit
    } else {
      resetForm();
    }
  }, [product, open]);

  const resetForm = () => {
      setName('');
      setPrice('');
      setCost('');
      setCategory('');
      setStock('');
      setMinStock('10');
      setUnit('pcs');
      setImagePreview(undefined);
      setImageFile(null);
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }
      
      // Simpan file asli untuk dikirim ke backend
      setImageFile(file);

      // Buat preview lokal
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(undefined);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !price || !cost || !category || !stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Gunakan FormData agar bisa kirim file
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('cost', cost);
    formData.append('category', category);
    formData.append('stock', stock);
    formData.append('minStock', minStock);
    formData.append('unit', unit);

    // Jika user memilih file baru, append ke formData
    if (imageFile) {
        formData.append('image', imageFile);
    }

    if (product) {
      // Logic update
      updateProduct(product.id, formData);
      toast.success('Product updated successfully');
    } else {
      // Logic add
      addProduct(formData);
      toast.success('Product added successfully');
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex justify-center">
            <div className="relative">
              <div 
                className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary hover:bg-muted"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Product" className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </button>
              {imagePreview && (
                <button
                  type="button"
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-transform hover:scale-110"
                  onClick={handleRemoveImage}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground">Click to upload product image (max 2MB)</p>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="Product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Selling Price</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cost</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Stock</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Min Stock</Label>
              <Input
                type="number"
                min="0"
                placeholder="10"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                placeholder="pcs"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {product ? 'Update' : 'Add'} Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}