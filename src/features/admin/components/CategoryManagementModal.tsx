import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../api/admin.service';
import { X, Tags, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryManagementModal = ({ isOpen, onClose }: Props) => {
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState('');

  // Fetch Categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: adminService.getServiceCategories,
    enabled: isOpen, // Only fetch when modal is open
  });

  // Create Category Mutation
  const createMutation = useMutation({
    mutationFn: (name: string) => adminService.createServiceCategory({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCategories'] });
      setNewCategoryName('');
      toast.success("Service Type added successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to add service type");
    }
  });

  // Delete Category Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteServiceCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCategories'] });
      toast.success("Service Type removed");
    },
    onError: () => toast.error("Failed to remove service type")
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    createMutation.mutate(newCategoryName.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[80vh]">
        
        {/* HEADER */}
        <div className="p-8 pb-6 border-b border-slate-100 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Tags className="text-brand-primary" size={24} />
                Service Types
              </h2>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                Manage Matrix Categories
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* BODY - ADD NEW */}
        <div className="p-8 pb-4 shrink-0 bg-slate-50/50">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Dry Clean, Iron Only"
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 shadow-sm"
              disabled={createMutation.isPending}
            />
            <button 
              type="submit"
              disabled={!newCategoryName.trim() || createMutation.isPending}
              className="px-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-brand-primary transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={20} />}
            </button>
          </form>
        </div>

        {/* BODY - LIST */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-0">
          {isLoading ? (
            <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
          ) : categories?.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
              <p className="text-xs font-bold text-slate-400">No service types added yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories?.map((cat) => (
                <div key={cat.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-slate-200 transition-colors">
                  <span className="font-bold text-slate-700">{cat.name}</span>
                  <button
                    onClick={() => {
                      if(window.confirm(`Are you sure you want to remove "${cat.name}"?`)) {
                        deleteMutation.mutate(cat.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};