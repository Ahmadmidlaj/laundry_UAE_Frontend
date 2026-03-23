import React, { useState } from 'react';
import { Minus, Plus, CheckCircle } from 'lucide-react';

interface Props {
  order: any;
  onConfirm: (updatedItems: any[]) => void;
  isSubmitting: boolean;
}

export const PickupVerification = ({ order, onConfirm, isSubmitting }: Props) => {
  // Initialize local state with existing items
  const [items, setItems] = useState(
    order.items.map((item: any) => ({
      item_id: item.item_id,
      name: item.name || `Item #${item.item_id}`, // UI fallback
      final_quantity: item.estimated_quantity || 1
    }))
  );

  const updateQty = (id: number, delta: number) => {
    setItems(prev => prev.map(item => 
      item.item_id === id 
        ? { ...item, final_quantity: Math.max(0, item.final_quantity + delta) }
        : item
    ));
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
        <p className="text-blue-700 text-sm font-medium">
          Verify counts with the customer. Adjust if they have more/fewer items.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.item_id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <p className="font-bold text-slate-800">{item.name}</p>
              <p className="text-xs text-slate-400">Item ID: {item.item_id}</p>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-lg">
              <button 
                onClick={() => updateQty(item.item_id, -1)}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 active:scale-90"
              >
                <Minus size={16} />
              </button>
              <span className="font-bold text-slate-900 min-w-[20px] text-center">
                {item.final_quantity}
              </span>
              <button 
                onClick={() => updateQty(item.item_id, 1)}
                className="w-8 h-8 flex items-center justify-center bg-brand-primary text-white rounded-md shadow-sm active:scale-90"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        disabled={isSubmitting}
        onClick={() => onConfirm(items.map(({ item_id, final_quantity }) => ({ item_id, final_quantity })))}
        className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
      >
        <CheckCircle size={20} />
        {isSubmitting ? 'Processing...' : 'Confirm & Collect Laundry'}
      </button>
    </div>
  );
};