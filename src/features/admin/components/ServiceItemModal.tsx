import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, type LaundryItem } from '../api/admin.service';
import { X, Shirt, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Strict validation logic
const serviceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  base_price: z.coerce.number().positive("Price must be greater than 0").min(0.5, "Minimum price is 0.50 AED"),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: LaundryItem | null;
}

export const ServiceItemModal = ({ isOpen, onClose, initialData }: Props) => {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema) as any,
    // This ensures the form resets when the modal opens with new/existing data
    values: initialData ? { name: initialData.name, base_price: initialData.base_price } : { name: '', base_price: 0 }
  });

  const mutation = useMutation({
    mutationFn: (data: ServiceFormValues) => 
      initialData 
        ? adminService.updateItem(initialData.id, data) 
        : adminService.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceItems'] });
      toast.success(initialData ? "Item updated successfully" : "New service added to catalog");
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Something went wrong");
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {initialData ? 'Update Service' : 'New Service'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

<form onSubmit={handleSubmit((data) => mutation.mutate(data as any))} className="space-y-6">            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Name</label>
              <div className="relative">
                <Shirt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  {...register('name')} 
                  placeholder="e.g. Suit (3-piece)" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary" 
                />
              </div>
              {errors.name && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (AED)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="number" 
                  step="0.01" 
                  {...register('base_price')} 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary" 
                />
              </div>
              {errors.base_price && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.base_price.message}</p>}
            </div>

            <button 
              disabled={mutation.isPending}
              className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-brand-primary transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <><Loader2 className="animate-spin" size={16} /> Syncing with Server...</>
              ) : (
                initialData ? 'Update Catalog' : 'Add to Catalog'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};