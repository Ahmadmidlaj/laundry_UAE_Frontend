// src/features/orders/components/PromoSlider.tsx
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { Gift, Zap } from 'lucide-react';

export const PromoSlider = () => {
  const { data: offers } = useQuery({
    queryKey: ['publicOffers'],
    queryFn: async () => (await api.get('/offers/')).data,
  });

  const activeOffers = offers?.filter((o: any) => o.is_active);

  if (!activeOffers || activeOffers.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
      {activeOffers.map((offer: any) => (
        <div 
          key={offer.id} 
          className="min-w-[280px] bg-gradient-to-br from-brand-primary to-blue-600 p-5 rounded-[2rem] text-white shadow-xl shadow-blue-100 flex items-center justify-between relative overflow-hidden shrink-0"
        >
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Limited Offer</p>
            <h3 className="text-lg font-black leading-tight mb-2">{offer.name}</h3>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md w-fit px-3 py-1 rounded-full border border-white/30">
              <span className="text-xs font-black italic">SAVE AED {offer.discount_amount}</span>
            </div>
          </div>
          <div className="relative z-10 p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
            <Gift size={24} />
          </div>
          {/* Decorative Circle */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
        </div>
      ))}
    </div>
  );
};