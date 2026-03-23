// src/features/orders/components/PriceRewardSummary.tsx
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface PriceSummaryProps {
  subtotal: number;
  discount: number;
  total: number;
}

export const PriceRewardSummary = ({ subtotal, discount, total }: PriceSummaryProps) => {
  const hasDiscount = discount > 0;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-3">
        <div className="flex justify-between items-center text-sm font-bold text-slate-500">
          <span>Items Subtotal</span>
          <span>AED {subtotal.toFixed(2)}</span>
        </div>

        {hasDiscount && (
          <div className="flex justify-between items-center text-sm font-black text-emerald-500 bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-2">
              <Sparkles size={16} fill="currentColor" />
              <span>Offer Applied!</span>
            </div>
            <span>- AED {discount.toFixed(2)}</span>
          </div>
        )}

        <div className="pt-3 border-t border-slate-50 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Amount</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">AED {total.toFixed(2)}</p>
          </div>
          {hasDiscount && (
             <div className="flex items-center gap-1.5 bg-brand-primary text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full mb-1">
               <CheckCircle2 size={12} /> You Saved AED {discount}
             </div>
          )}
        </div>
      </div>
      
      {hasDiscount && (
        <p className="text-center text-[11px] font-bold text-slate-400 italic">
          "The best things in life are clean (and discounted)."
        </p>
      )}
    </div>
  );
};