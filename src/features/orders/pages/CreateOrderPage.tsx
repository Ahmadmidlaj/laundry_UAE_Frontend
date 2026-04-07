// src/features/orders/pages/CreateOrderPage.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ordersService, type OrderPayload } from '../api/orders.service';
import { adminService } from '@/features/admin/api/admin.service'; 
import { userService } from '@/features/user/api/user.service';
import { Plus, Minus, Calendar, ShoppingBag, ArrowRight, Sparkles, Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { OrderSuccessScreen } from '../components/OrderSuccessScreen';
import { useAuthStore } from '@/store/useAuthStore';

export const CreateOrderPage = () => {
  const { user: authUser } = useAuthStore();
  
  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userService.getMe,
    initialData: authUser
  });

  const walletBalance = profile?.wallet_balance || 0;

  const { data: config } = useQuery({
    queryKey: ['systemConfig'],
    queryFn: adminService.getSystemConfig,
  });

  const [cart, setCart] = useState<Record<number, number>>({});
  const [pickupDate, setPickupDate] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [finalSavings, setFinalSavings] = useState(0);

  const [useWallet, setUseWallet] = useState(false);
  const [creditsToUse, setCreditsToUse] = useState<number>(0);

  const minPickupTime = useMemo(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, []);

  const { data: items } = useQuery({
    queryKey: ['laundryItems'],
    queryFn: ordersService.getItems,
  });

  const { data: offers } = useQuery({
    queryKey: ['activeOffers'],
    queryFn: adminService.getOffers,
  });

  const { subtotal, appliedOffer, discount, total } = useMemo(() => {
    if (!items) return { subtotal: 0, appliedOffer: null, discount: 0, total: 0 };
    const sub = items.reduce((sum, item) => sum + (item.base_price * (cart[item.id] || 0)), 0);
    const bestOffer = offers
      ?.filter(o => o.is_active && sub >= o.min_order_amount)
      .sort((a, b) => b.discount_amount - a.discount_amount)[0];
    const disc = bestOffer ? bestOffer.discount_amount : 0;
    
    return {
      subtotal: sub,
      appliedOffer: bestOffer || null,
      discount: disc,
      total: Math.max(0, sub - disc)
    };
  }, [cart, items, offers]);

  const maxUsableCredits = Math.min(walletBalance, total);

  const orderMutation = useMutation({
    mutationFn: ordersService.createOrder,
    onSuccess: () => {
      setFinalSavings(discount + (useWallet ? creditsToUse : 0)); 
      setShowSuccess(true);
    },
  });

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
    }));
  };

  const handleCreditChange = (val: number) => {
    const numericVal = Math.max(0, Math.min(val, maxUsableCredits));
    setCreditsToUse(numericVal);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (subtotal === 0) return toast.error('Add at least one item');
    if (!pickupDate) return toast.error('Please select a pickup schedule');

    const selectedDateTime = new Date(pickupDate);
    const now = new Date();
    const diffInMinutes = (selectedDateTime.getTime() - now.getTime()) / (1000 * 60);

    if (diffInMinutes < 60) {
      return toast.error("Pickup time must be at least 1 hour from now.");
    }

    const [datePart, timePart] = pickupDate.split('T');
    const payload: OrderPayload = {
      pickup_date: datePart,
      pickup_time: timePart,
      items: Object.entries(cart)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({ item_id: Number(id), estimated_quantity: qty })),
      notes: "",
      credits_to_use: useWallet ? creditsToUse : 0 
    };
    
    orderMutation.mutate(payload);
  };

  const finalDisplayTotal = Math.max(0, total - (useWallet ? creditsToUse : 0));

  return (
    <div className="relative min-h-screen">
      {/* 1. BACKGROUND LAYER */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center opacity-40 brightness-75 pointer-events-none"
        style={{ backgroundImage: "url('/images/bg4.jpg')" }}
      />

      {/* 2. CONTENT LAYER */}
      <div className="relative z-10 max-w-2xl mx-auto space-y-8 pb-12 px-4 pt-4">
        
        <header className="bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-white shadow-sm mt-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">New Order</h1>
          <p className="text-slate-500 font-medium">Professional care for your favorites.</p>
        </header>

        {/* Item Selection Section */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2 bg-white/50 backdrop-blur-md w-max px-3 py-1.5 rounded-lg border border-white">
            <ShoppingBag size={14} /> Service Menu
          </h3>
          <div className="grid gap-3">
            {items?.map((item) => (
              <div key={item.id} className="bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] border border-white shadow-sm flex items-center justify-between group hover:border-brand-primary/40 transition-all">
                <div>
                  <p className="font-bold text-slate-800 group-hover:text-brand-primary transition-colors">{item.name}</p>
                  <p className="text-xs font-bold text-slate-500">AED {item.base_price} / pc</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-100/50 p-1.5 rounded-2xl">
                  <button onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-sm active:scale-90 transition-all"><Minus size={14}/></button>
                  <span className="w-4 text-center font-black text-sm">{cart[item.id] || 0}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"><Plus size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Schedule Section */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2 bg-white/50 backdrop-blur-md w-max px-3 py-1.5 rounded-lg border border-white">
            <Calendar size={14} /> When should we come?
          </h3>
          <div className="relative">
            <input 
              type="datetime-local" 
              value={pickupDate}
              min={minPickupTime}
              onChange={(e) => setPickupDate(e.target.value)}
              className={`w-full p-5 bg-white/90 backdrop-blur-xl border border-white rounded-[1.5rem] font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-sm ${
                pickupDate ? "text-slate-900" : "text-slate-500"
              }`}
            />
            {!pickupDate && (
              <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                <span className="text-slate-500 font-bold bg-white/90 pr-8">Tap to select date & time</span>
              </div>
            )}
          </div>
        </section>
        
        {/* Order Summary & Wallet Engine */}
        <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl shadow-slate-200 space-y-4 relative overflow-hidden">
          {/* Subtle glow effect behind checkout card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            {appliedOffer && (
              <div className="flex items-center justify-between bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 animate-pulse mb-4">
                 <div className="flex items-center gap-2">
                   <Sparkles size={14} className="text-yellow-400" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Saving {appliedOffer.name}</span>
                 </div>
                 <span className="font-black text-xs">- AED {discount}</span>
              </div>
            )}

            {/* WALLET SECTION */}
            {config?.referral_system_enabled && walletBalance > 0 && (
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3 animate-in fade-in duration-500 mb-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3 text-white">
                    <div className="p-2 bg-brand-primary/20 rounded-lg text-brand-primary group-hover:scale-110 transition-transform">
                      <Wallet size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest">Pay with Credits</p>
                      <p className="text-[10px] text-slate-400 font-bold tracking-wider">Balance: {walletBalance.toFixed(2)} pts</p>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${useWallet ? 'bg-brand-primary' : 'bg-slate-700'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform ${useWallet ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={useWallet} 
                    onChange={(e) => {
                      setUseWallet(e.target.checked);
                      if (e.target.checked && creditsToUse === 0) {
                        setCreditsToUse(maxUsableCredits);
                      }
                    }} 
                  />
                </label>

                {useWallet && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2 border-t border-white/10 flex gap-2">
                    <input 
                      type="number"
                      value={creditsToUse || ''}
                      onChange={(e) => handleCreditChange(Number(e.target.value))}
                      max={maxUsableCredits}
                      min={0}
                      className="flex-1 bg-white/10 border border-white/10 text-white rounded-xl px-4 py-2 font-black outline-none focus:border-brand-primary transition-colors"
                      placeholder="0"
                    />
                    <button 
                      type="button" 
                      onClick={() => setCreditsToUse(maxUsableCredits)} 
                      className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                      Max
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-white">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Estimated Total</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tighter">AED {finalDisplayTotal.toFixed(2)}</span>
                  {(discount > 0 || (useWallet && creditsToUse > 0)) && (
                    <span className="text-xs font-bold text-white/30 line-through">AED {subtotal.toFixed(2)}</span>
                  )}
                </div>
              </div>
              
              <button 
                onClick={handleSubmit}
                disabled={subtotal === 0 || orderMutation.isPending}
                className="bg-brand-primary text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
              >
                {orderMutation.isPending ? <Loader2 className="animate-spin" size={16}/> : (
                  <>Place Order <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {showSuccess && <OrderSuccessScreen savings={finalSavings} pickupDateTime={pickupDate} onClose={() => setShowSuccess(false)} />}
      </div>
    </div>
  );
};
// import { useState, useMemo } from 'react';
// import { useQuery, useMutation } from '@tanstack/react-query';
// import { ordersService, type OrderPayload } from '../api/orders.service';
// import { adminService } from '@/features/admin/api/admin.service'; 
// import { userService } from '@/features/user/api/user.service'; // <-- Added this
// import { Plus, Minus, Calendar, ShoppingBag, ArrowRight, Sparkles, Loader2, Wallet } from 'lucide-react';
// import { toast } from 'sonner';
// import { OrderSuccessScreen } from '../components/OrderSuccessScreen';
// import { useAuthStore } from '@/store/useAuthStore';

// export const CreateOrderPage = () => {
//   const { user: authUser } = useAuthStore();
  
//   // 1. FETCH LIVE PROFILE: This ensures credits update without re-logging
//   const { data: profile } = useQuery({
//     queryKey: ['userProfile'],
//     queryFn: userService.getMe,
//     initialData: authUser
//   });

//   const walletBalance = profile?.wallet_balance || 0;

//   // 2. FETCH SYSTEM CONFIG
//   const { data: config } = useQuery({
//     queryKey: ['systemConfig'],
//     queryFn: adminService.getSystemConfig,
//   });

//   const [cart, setCart] = useState<Record<number, number>>({});
//   const [pickupDate, setPickupDate] = useState('');
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [finalSavings, setFinalSavings] = useState(0);

//   const [useWallet, setUseWallet] = useState(false);
//   const [creditsToUse, setCreditsToUse] = useState<number>(0);

//   const minPickupTime = useMemo(() => {
//     const now = new Date();
//     now.setHours(now.getHours() + 1);
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     const hours = String(now.getHours()).padStart(2, '0');
//     const minutes = String(now.getMinutes()).padStart(2, '0');
//     return `${year}-${month}-${day}T${hours}:${minutes}`;
//   }, []);

//   const { data: items } = useQuery({
//     queryKey: ['laundryItems'],
//     queryFn: ordersService.getItems,
//   });

//   const { data: offers } = useQuery({
//     queryKey: ['activeOffers'],
//     queryFn: adminService.getOffers,
//   });

//   const { subtotal, appliedOffer, discount, total } = useMemo(() => {
//     if (!items) return { subtotal: 0, appliedOffer: null, discount: 0, total: 0 };
//     const sub = items.reduce((sum, item) => sum + (item.base_price * (cart[item.id] || 0)), 0);
//     const bestOffer = offers
//       ?.filter(o => o.is_active && sub >= o.min_order_amount)
//       .sort((a, b) => b.discount_amount - a.discount_amount)[0];
//     const disc = bestOffer ? bestOffer.discount_amount : 0;
    
//     return {
//       subtotal: sub,
//       appliedOffer: bestOffer || null,
//       discount: disc,
//       total: Math.max(0, sub - disc)
//     };
//   }, [cart, items, offers]);

//   // Max credits limited by order total
//   const maxUsableCredits = Math.min(walletBalance, total);

//   const orderMutation = useMutation({
//     mutationFn: ordersService.createOrder,
//     onSuccess: () => {
//       setFinalSavings(discount + (useWallet ? creditsToUse : 0)); 
//       setShowSuccess(true);
//     },
//   });

//   const updateQuantity = (itemId: number, delta: number) => {
//     setCart((prev) => ({
//       ...prev,
//       [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
//     }));
//   };

//   const handleCreditChange = (val: number) => {
//     const numericVal = Math.max(0, Math.min(val, maxUsableCredits));
//     setCreditsToUse(numericVal);
//   };

//   const handleSubmit = (e?: React.FormEvent) => {
//     if (e) e.preventDefault();
//     if (subtotal === 0) return toast.error('Add at least one item');
//     if (!pickupDate) return toast.error('Please select a pickup schedule');

//     const selectedDateTime = new Date(pickupDate);
//     const now = new Date();
//     const diffInMinutes = (selectedDateTime.getTime() - now.getTime()) / (1000 * 60);

//     if (diffInMinutes < 60) {
//       return toast.error("Pickup time must be at least 1 hour from now.");
//     }

//     const [datePart, timePart] = pickupDate.split('T');
//     const payload: OrderPayload = {
//       pickup_date: datePart,
//       pickup_time: timePart,
//       items: Object.entries(cart)
//         .filter(([_, qty]) => qty > 0)
//         .map(([id, qty]) => ({ item_id: Number(id), estimated_quantity: qty })),
//       notes: "",
//       credits_to_use: useWallet ? creditsToUse : 0 
//     };
    
//     orderMutation.mutate(payload);
//   };

//   const finalDisplayTotal = Math.max(0, total - (useWallet ? creditsToUse : 0));

//   return (
//     <div className="max-w-2xl mx-auto space-y-8 pb-12 px-4 pt-4">
//       <header>
//         <h1 className="text-3xl font-black text-slate-900 tracking-tighter">New Order</h1>
//         <p className="text-slate-500 font-medium">Professional care for your favorites.</p>
//       </header>

//       {/* Item Selection Section */}
//       <section className="space-y-4">
//         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
//           <ShoppingBag size={14} /> Service Menu
//         </h3>
//         <div className="grid gap-3">
//           {items?.map((item) => (
//             <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-primary/20 transition-all">
//               <div>
//                 <p className="font-bold text-slate-800 group-hover:text-brand-primary transition-colors">{item.name}</p>
//                 <p className="text-xs font-bold text-slate-400">AED {item.base_price} / pc</p>
//               </div>
//               <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl">
//                 <button onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-sm active:scale-90 transition-all"><Minus size={14}/></button>
//                 <span className="w-4 text-center font-black text-sm">{cart[item.id] || 0}</span>
//                 <button onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"><Plus size={14}/></button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* Schedule Section */}
//       <section className="space-y-4">
//         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
//           <Calendar size={14} /> When should we come?
//         </h3>
//         <div className="relative">
//           <input 
//             type="datetime-local" 
//             value={pickupDate}
//             min={minPickupTime}
//             onChange={(e) => setPickupDate(e.target.value)}
//             className={`w-full p-5 bg-white border border-slate-100 rounded-[1.5rem] font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-sm ${
//               pickupDate ? "text-slate-900" : "text-slate-400"
//             }`}
//           />
//           {!pickupDate && (
//             <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
//               <span className="text-slate-400 font-bold bg-white pr-8">Tap to select date & time</span>
//             </div>
//           )}
//         </div>
//       </section>
      
//       {/* UPGRADED: Order Summary & Wallet Engine */}
//       <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl shadow-slate-200 space-y-4">
//         {appliedOffer && (
//           <div className="flex items-center justify-between bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 animate-pulse">
//              <div className="flex items-center gap-2">
//                <Sparkles size={14} className="text-yellow-400" />
//                <span className="text-[10px] font-black uppercase tracking-widest">Saving {appliedOffer.name}</span>
//              </div>
//              <span className="font-black text-xs">- AED {discount}</span>
//           </div>
//         )}

//         {/* WALLET SECTION: Only shows if system is ON AND balance > 0 */}
//         {config?.referral_system_enabled && walletBalance > 0 && (
//           <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3 animate-in fade-in duration-500">
//             <label className="flex items-center justify-between cursor-pointer group">
//               <div className="flex items-center gap-3 text-white">
//                 <div className="p-2 bg-brand-primary/20 rounded-lg text-brand-primary group-hover:scale-110 transition-transform">
//                   <Wallet size={16} />
//                 </div>
//                 <div>
//                   <p className="text-xs font-black uppercase tracking-widest">Pay with Credits</p>
//                   <p className="text-[10px] text-slate-400 font-bold tracking-wider">Balance: {walletBalance.toFixed(2)} pts</p>
//                 </div>
//               </div>
//               <div className={`w-10 h-6 rounded-full p-1 transition-colors ${useWallet ? 'bg-brand-primary' : 'bg-slate-700'}`}>
//                 <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform ${useWallet ? 'translate-x-4' : 'translate-x-0'}`}></div>
//               </div>
//               <input 
//                 type="checkbox" 
//                 className="hidden" 
//                 checked={useWallet} 
//                 onChange={(e) => {
//                   setUseWallet(e.target.checked);
//                   if (e.target.checked && creditsToUse === 0) {
//                     setCreditsToUse(maxUsableCredits);
//                   }
//                 }} 
//               />
//             </label>

//             {useWallet && (
//               <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2 border-t border-white/10 flex gap-2">
//                 <input 
//                   type="number"
//                   value={creditsToUse || ''}
//                   onChange={(e) => handleCreditChange(Number(e.target.value))}
//                   max={maxUsableCredits}
//                   min={0}
//                   className="flex-1 bg-white/10 border border-white/10 text-white rounded-xl px-4 py-2 font-black outline-none focus:border-brand-primary transition-colors"
//                   placeholder="0"
//                 />
//                 <button 
//                   type="button" 
//                   onClick={() => setCreditsToUse(maxUsableCredits)} 
//                   className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
//                 >
//                   Max
//                 </button>
//               </div>
//             )}
//           </div>
//         )}

//         <div className="flex items-center justify-between pt-2">
//           <div className="text-white">
//             <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Estimated Total</span>
//             <div className="flex items-baseline gap-2">
//               <span className="text-3xl font-black tracking-tighter">AED {finalDisplayTotal.toFixed(2)}</span>
//               {(discount > 0 || (useWallet && creditsToUse > 0)) && (
//                 <span className="text-xs font-bold text-white/30 line-through">AED {subtotal.toFixed(2)}</span>
//               )}
//             </div>
//           </div>
          
//           <button 
//             onClick={handleSubmit}
//             disabled={subtotal === 0 || orderMutation.isPending}
//             className="bg-brand-primary text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
//           >
//             {orderMutation.isPending ? <Loader2 className="animate-spin" size={16}/> : (
//               <>Place Order <ArrowRight size={16} /></>
//             )}
//           </button>
//         </div>
//       </div>

// {showSuccess && <OrderSuccessScreen savings={finalSavings} pickupDateTime={pickupDate} onClose={() => setShowSuccess(false)} />}    </div>
//   );
// };
// import { useState, useMemo } from 'react';
// import { useQuery, useMutation } from '@tanstack/react-query';
// import { ordersService, type OrderPayload } from '../api/orders.service';
// import { adminService } from '@/features/admin/api/admin.service'; 
// import { Plus, Minus, Calendar, ShoppingBag, ArrowRight, Sparkles, Loader2, Wallet } from 'lucide-react';
// import { toast } from 'sonner';
// import { OrderSuccessScreen } from '../components/OrderSuccessScreen';
// import { useAuthStore } from '@/store/useAuthStore';

// export const CreateOrderPage = () => {
//   const { user } = useAuthStore();
//   const walletBalance = user?.wallet_balance || 0;

//   // NEW: Fetch System Config to check if referral is enabled
//   const { data: config } = useQuery({
//     queryKey: ['systemConfig'],
//     queryFn: adminService.getSystemConfig,
//   });

//   const [cart, setCart] = useState<Record<number, number>>({});
//   const [pickupDate, setPickupDate] = useState('');
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [finalSavings, setFinalSavings] = useState(0);

//   const [useWallet, setUseWallet] = useState(false);
//   const [creditsToUse, setCreditsToUse] = useState<number>(0);

//   const minPickupTime = useMemo(() => {
//     const now = new Date();
//     now.setHours(now.getHours() + 1);
    
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     const hours = String(now.getHours()).padStart(2, '0');
//     const minutes = String(now.getMinutes()).padStart(2, '0');
    
//     return `${year}-${month}-${day}T${hours}:${minutes}`;
//   }, []);

//   const { data: items } = useQuery({
//     queryKey: ['laundryItems'],
//     queryFn: ordersService.getItems,
//   });

//   const { data: offers } = useQuery({
//     queryKey: ['activeOffers'],
//     queryFn: adminService.getOffers,
//   });

//   const { subtotal, appliedOffer, discount, total } = useMemo(() => {
//     if (!items) return { subtotal: 0, appliedOffer: null, discount: 0, total: 0 };
//     const sub = items.reduce((sum, item) => sum + (item.base_price * (cart[item.id] || 0)), 0);
//     const bestOffer = offers
//       ?.filter(o => o.is_active && sub >= o.min_order_amount)
//       .sort((a, b) => b.discount_amount - a.discount_amount)[0];
//     const disc = bestOffer ? bestOffer.discount_amount : 0;
    
//     return {
//       subtotal: sub,
//       appliedOffer: bestOffer || null,
//       discount: disc,
//       total: Math.max(0, sub - disc)
//     };
//   }, [cart, items, offers]);

//   const maxUsableCredits = Math.min(walletBalance, total);

//   const orderMutation = useMutation({
//     mutationFn: ordersService.createOrder,
//     onSuccess: () => {
//       setFinalSavings(discount + (useWallet ? creditsToUse : 0)); 
//       setShowSuccess(true);
//     },
//   });

//   const updateQuantity = (itemId: number, delta: number) => {
//     setCart((prev) => ({
//       ...prev,
//       [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
//     }));
//   };

//   const handleCreditChange = (val: number) => {
//     if (val < 0) val = 0;
//     if (val > maxUsableCredits) val = maxUsableCredits;
//     setCreditsToUse(val);
//   };

//   const handleSubmit = (e?: React.FormEvent) => {
//     if (e) e.preventDefault();
//     if (subtotal === 0) return toast.error('Add at least one item');
//     if (!pickupDate) return toast.error('Please select a pickup schedule');

//     const selectedDateTime = new Date(pickupDate);
//     const now = new Date();
//     const diffInMinutes = (selectedDateTime.getTime() - now.getTime()) / (1000 * 60);

//     if (diffInMinutes < 60) {
//       return toast.error("Pickup time must be at least 1 hour from now.");
//     }

//     const [datePart, timePart] = pickupDate.split('T');
//     const payload: OrderPayload = {
//       pickup_date: datePart,
//       pickup_time: timePart,
//       items: Object.entries(cart)
//         .filter(([_, qty]) => qty > 0)
//         .map(([id, qty]) => ({ item_id: Number(id), estimated_quantity: qty })),
//       notes: "",
//       credits_to_use: useWallet ? creditsToUse : 0 
//     };
    
//     orderMutation.mutate(payload);
//   };

//   const finalDisplayTotal = Math.max(0, total - (useWallet ? creditsToUse : 0));

//   return (
//     <div className="max-w-2xl mx-auto space-y-8 pb-12 px-4 pt-4">
//       <header>
//         <h1 className="text-3xl font-black text-slate-900 tracking-tighter">New Order</h1>
//         <p className="text-slate-500 font-medium">Professional care for your favorites.</p>
//       </header>

//       <section className="space-y-4">
//         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
//           <ShoppingBag size={14} /> Service Menu
//         </h3>
//         <div className="grid gap-3">
//           {items?.map((item) => (
//             <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-primary/20 transition-all">
//               <div>
//                 <p className="font-bold text-slate-800 group-hover:text-brand-primary transition-colors">{item.name}</p>
//                 <p className="text-xs font-bold text-slate-400">AED {item.base_price} / pc</p>
//               </div>
//               <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl">
//                 <button onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-sm active:scale-90 transition-all"><Minus size={14}/></button>
//                 <span className="w-4 text-center font-black text-sm">{cart[item.id] || 0}</span>
//                 <button onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"><Plus size={14}/></button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>

//       <section className="space-y-4">
//         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
//           <Calendar size={14} /> When should we come?
//         </h3>
//         <div className="relative">
//           <input 
//             type="datetime-local" 
//             value={pickupDate}
//             min={minPickupTime}
//             onChange={(e) => {
//               if (e.target.value < minPickupTime) {
//                 toast.error("Pickup must be at least 1 hour from now");
//                 return;
//               }
//               setPickupDate(e.target.value);
//             }}
//             className={`w-full p-5 bg-white border border-slate-100 rounded-[1.5rem] font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-sm ${
//               pickupDate ? "text-slate-900" : "text-slate-400"
//             }`}
//           />
//           {!pickupDate && (
//             <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
//               <span className="text-slate-400 font-bold bg-white pr-8">Tap to select date & time</span>
//             </div>
//           )}
//         </div>
//       </section>
      
//       <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl shadow-slate-200 space-y-4">
//         {appliedOffer && (
//           <div className="flex items-center justify-between bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 animate-pulse">
//              <div className="flex items-center gap-2">
//                <Sparkles size={14} className="text-yellow-400" />
//                <span className="text-[10px] font-black uppercase tracking-widest">Saving {appliedOffer.name}</span>
//              </div>
//              <span className="font-black text-xs">- AED {discount}</span>
//           </div>
//         )}

//         {/* WALLET SECTION: Only shows if referral_system_enabled is true */}
//         {config?.referral_system_enabled && (
//           <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3 animate-in fade-in duration-500">
//             <label className="flex items-center justify-between cursor-pointer group">
//               <div className="flex items-center gap-3 text-white">
//                 <div className="p-2 bg-brand-primary/20 rounded-lg text-brand-primary group-hover:scale-110 transition-transform">
//                   <Wallet size={16} />
//                 </div>
//                 <div>
//                   <p className="text-xs font-black uppercase tracking-widest">Pay with Credits</p>
//                   <p className="text-[10px] text-slate-400 font-bold tracking-wider">Balance: {walletBalance.toFixed(2)} pts</p>
//                 </div>
//               </div>
//               <div className={`w-10 h-6 rounded-full p-1 transition-colors ${useWallet ? 'bg-brand-primary' : 'bg-slate-700'}`}>
//                 <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform ${useWallet ? 'translate-x-4' : 'translate-x-0'}`}></div>
//               </div>
//               <input 
//                 type="checkbox" 
//                 className="hidden" 
//                 checked={useWallet} 
//                 onChange={(e) => {
//                   setUseWallet(e.target.checked);
//                   if (e.target.checked && creditsToUse === 0) {
//                     setCreditsToUse(maxUsableCredits);
//                   }
//                 }} 
//               />
//             </label>

//             {useWallet && (
//               <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2 border-t border-white/10 flex gap-2">
//                 <input 
//                   type="number"
//                   value={creditsToUse || ''}
//                   onChange={(e) => handleCreditChange(Number(e.target.value))}
//                   max={maxUsableCredits}
//                   min={0}
//                   className="flex-1 bg-white/10 border border-white/10 text-white rounded-xl px-4 py-2 font-black outline-none focus:border-brand-primary transition-colors"
//                   placeholder="0"
//                 />
//                 <button 
//                   type="button" 
//                   onClick={() => setCreditsToUse(maxUsableCredits)} 
//                   className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
//                 >
//                   Max
//                 </button>
//               </div>
//             )}
//           </div>
//         )}

//         <div className="flex items-center justify-between pt-2">
//           <div className="text-white">
//             <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Estimated Total</span>
//             <div className="flex items-baseline gap-2">
//               <span className="text-3xl font-black tracking-tighter">AED {finalDisplayTotal.toFixed(2)}</span>
//               {(discount > 0 || (useWallet && creditsToUse > 0)) && (
//                 <span className="text-xs font-bold text-white/30 line-through">AED {subtotal.toFixed(2)}</span>
//               )}
//             </div>
//           </div>
          
//           <button 
//             onClick={handleSubmit}
//             disabled={subtotal === 0 || orderMutation.isPending}
//             className="bg-brand-primary text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
//           >
//             {orderMutation.isPending ? <Loader2 className="animate-spin" size={16}/> : (
//               <>Place Order <ArrowRight size={16} /></>
//             )}
//           </button>
//         </div>
//       </div>

//       {showSuccess && <OrderSuccessScreen savings={finalSavings} onClose={() => setShowSuccess(false)} />}
//     </div>
//   );
// };
// // src/features/orders/pages/CreateOrderPage.tsx
// import { useState, useMemo } from 'react';
// import { useQuery, useMutation } from '@tanstack/react-query';
// import { ordersService, type OrderPayload } from '../api/orders.service';
// import { adminService } from '@/features/admin/api/admin.service'; 
// import { Plus, Minus, Calendar, ShoppingBag, ArrowRight, Sparkles, Loader2, Wallet } from 'lucide-react';
// import { toast } from 'sonner';
// import { OrderSuccessScreen } from '../components/OrderSuccessScreen';
// import { useAuthStore } from '@/store/useAuthStore'; // <-- Imported to get wallet balance

// export const CreateOrderPage = () => {
//   const { user } = useAuthStore(); // <-- Get current user data
//   const walletBalance = user?.wallet_balance || 0;

//   const { data: config } = useQuery({
//     queryKey: ['systemConfig'],
//     queryFn: adminService.getSystemConfig,
//   });

//   const [cart, setCart] = useState<Record<number, number>>({});
//   const [pickupDate, setPickupDate] = useState('');
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [finalSavings, setFinalSavings] = useState(0);

//   // NEW: Wallet States
//   const [useWallet, setUseWallet] = useState(false);
//   const [creditsToUse, setCreditsToUse] = useState<number>(0);

//   const minPickupTime = useMemo(() => {
//     const now = new Date();
//     now.setHours(now.getHours() + 1); // Add the 1-hour buffer
    
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     const hours = String(now.getHours()).padStart(2, '0');
//     const minutes = String(now.getMinutes()).padStart(2, '0');
    
//     return `${year}-${month}-${day}T${hours}:${minutes}`;
//   }, []);

//   const { data: items } = useQuery({
//     queryKey: ['laundryItems'],
//     queryFn: ordersService.getItems,
//   });

//   const { data: offers } = useQuery({
//     queryKey: ['activeOffers'],
//     queryFn: adminService.getOffers,
//   });

//   const { subtotal, appliedOffer, discount, total } = useMemo(() => {
//     if (!items) return { subtotal: 0, appliedOffer: null, discount: 0, total: 0 };
//     const sub = items.reduce((sum, item) => sum + (item.base_price * (cart[item.id] || 0)), 0);
//     const bestOffer = offers
//       ?.filter(o => o.is_active && sub >= o.min_order_amount)
//       .sort((a, b) => b.discount_amount - a.discount_amount)[0];
//     const disc = bestOffer ? bestOffer.discount_amount : 0;
    
//     return {
//       subtotal: sub,
//       appliedOffer: bestOffer || null,
//       discount: disc,
//       total: Math.max(0, sub - disc)
//     };
//   }, [cart, items, offers]);

//   // Max credits they can use is either their total balance OR the total order cost (whichever is lower)
//   const maxUsableCredits = Math.min(walletBalance, total);

//   const orderMutation = useMutation({
//     mutationFn: ordersService.createOrder,
//     onSuccess: () => {
//       // Show total savings including the wallet usage!
//       setFinalSavings(discount + (useWallet ? creditsToUse : 0)); 
//       setShowSuccess(true);
//     },
//   });

//   const updateQuantity = (itemId: number, delta: number) => {
//     setCart((prev) => ({
//       ...prev,
//       [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
//     }));
//   };

//   const handleCreditChange = (val: number) => {
//     if (val < 0) val = 0;
//     if (val > maxUsableCredits) val = maxUsableCredits;
//     setCreditsToUse(val);
//   };

//   const handleSubmit = (e?: React.FormEvent) => {
//     if (e) e.preventDefault();
//     if (subtotal === 0) return toast.error('Add at least one item');
//     if (!pickupDate) return toast.error('Please select a pickup schedule');

//     const selectedDateTime = new Date(pickupDate);
//     const now = new Date();
    
//     const diffInMinutes = (selectedDateTime.getTime() - now.getTime()) / (1000 * 60);

//     if (diffInMinutes < 60) {
//       return toast.error("Pickup time must be at least 1 hour from now.");
//     }

//     const [datePart, timePart] = pickupDate.split('T');
    
//     const payload: OrderPayload = {
//       pickup_date: datePart,
//       pickup_time: timePart,
//       items: Object.entries(cart)
//         .filter(([_, qty]) => qty > 0)
//         .map(([id, qty]) => ({ item_id: Number(id), estimated_quantity: qty })),
//       notes: "",
//       credits_to_use: useWallet ? creditsToUse : 0 // <-- Pass credits safely to API
//     };
    
//     orderMutation.mutate(payload);
//   };

//   // The actual final price displayed to user
//   const finalDisplayTotal = Math.max(0, total - (useWallet ? creditsToUse : 0));

//   return (
//     <div className="max-w-2xl mx-auto space-y-8 pb-12 px-4 pt-4">
//       <header>
//         <h1 className="text-3xl font-black text-slate-900 tracking-tighter">New Order</h1>
//         <p className="text-slate-500 font-medium">Professional care for your favorites.</p>
//       </header>

//       {/* Item Selection Section */}
//       <section className="space-y-4">
//         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
//           <ShoppingBag size={14} /> Service Menu
//         </h3>
//         <div className="grid gap-3">
//           {items?.map((item) => (
//             <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-primary/20 transition-all">
//               <div>
//                 <p className="font-bold text-slate-800 group-hover:text-brand-primary transition-colors">{item.name}</p>
//                 <p className="text-xs font-bold text-slate-400">AED {item.base_price} / pc</p>
//               </div>
//               <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl">
//                 <button onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-sm active:scale-90 transition-all"><Minus size={14}/></button>
//                 <span className="w-4 text-center font-black text-sm">{cart[item.id] || 0}</span>
//                 <button onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"><Plus size={14}/></button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* Schedule Section */}
//       <section className="space-y-4">
//         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
//           <Calendar size={14} /> When should we come?
//         </h3>
//         <div className="relative">
//           <input 
//             type="datetime-local" 
//             value={pickupDate}
//             min={minPickupTime}
//             onChange={(e) => {
//               if (e.target.value < minPickupTime) {
//                 toast.error("Pickup must be at least 1 hour from now");
//                 return;
//               }
//               setPickupDate(e.target.value);
//             }}
//             className={`w-full p-5 bg-white border border-slate-100 rounded-[1.5rem] font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-sm ${
//               pickupDate ? "text-slate-900" : "text-slate-400"
//             }`}
//           />
          
//           {/* Custom Mobile-Friendly Placeholder */}
//           {!pickupDate && (
//             <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
//               <span className="text-slate-400 font-bold bg-white pr-8">
//                 Tap to select date & time
//               </span>
//             </div>
//           )}
//         </div>
//       </section>
      
//       {/* UPGRADED: Order Summary & Wallet Engine */}
//       <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl shadow-slate-200 space-y-4">
        
//         {appliedOffer && (
//           <div className="flex items-center justify-between bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 animate-pulse">
//              <div className="flex items-center gap-2">
//                <Sparkles size={14} className="text-yellow-400" />
//                <span className="text-[10px] font-black uppercase tracking-widest">Saving {appliedOffer.name}</span>
//              </div>
//              <span className="font-black text-xs">- AED {discount}</span>
//           </div>
//         )}

//         {/* Wallet Toggle & Input */}
//         <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3">
//           <label className="flex items-center justify-between cursor-pointer group">
//             <div className="flex items-center gap-3 text-white">
//               <div className="p-2 bg-brand-primary/20 rounded-lg text-brand-primary group-hover:scale-110 transition-transform">
//                 <Wallet size={16} />
//               </div>
//               <div>
//                 <p className="text-xs font-black uppercase tracking-widest">Pay with Credits</p>
//                 <p className="text-[10px] text-slate-400 font-bold tracking-wider">Balance: {walletBalance.toFixed(2)} pts</p>
//               </div>
//             </div>
            
//             {/* The Toggle UI */}
//             <div className={`w-10 h-6 rounded-full p-1 transition-colors ${useWallet ? 'bg-brand-primary' : 'bg-slate-700'}`}>
//               <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform ${useWallet ? 'translate-x-4' : 'translate-x-0'}`}></div>
//             </div>
//             {/* Hidden actual checkbox to control state */}
//             <input 
//               type="checkbox" 
//               className="hidden" 
//               checked={useWallet} 
//               onChange={(e) => {
//                 setUseWallet(e.target.checked);
//                 // Auto-fill max available credits when toggled on
//                 if (e.target.checked && creditsToUse === 0) {
//                   setCreditsToUse(maxUsableCredits);
//                 }
//               }} 
//             />
//           </label>

//           {useWallet && (
//             <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2 border-t border-white/10 flex gap-2">
//               <input 
//                 type="number"
//                 value={creditsToUse || ''}
//                 onChange={(e) => handleCreditChange(Number(e.target.value))}
//                 max={maxUsableCredits}
//                 min={0}
//                 className="flex-1 bg-white/10 border border-white/10 text-white rounded-xl px-4 py-2 font-black outline-none focus:border-brand-primary transition-colors"
//                 placeholder="0"
//               />
//               <button 
//                 type="button"
//                 onClick={() => setCreditsToUse(maxUsableCredits)}
//                 className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
//               >
//                 Max
//               </button>
//             </div>
//           )}
//         </div>

//         <div className="flex items-center justify-between pt-2">
//           <div className="text-white">
//             <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Estimated Total</span>
//             <div className="flex items-baseline gap-2">
//               <span className="text-3xl font-black tracking-tighter">AED {finalDisplayTotal.toFixed(2)}</span>
//               {(discount > 0 || (useWallet && creditsToUse > 0)) && (
//                 <span className="text-xs font-bold text-white/30 line-through">AED {subtotal.toFixed(2)}</span>
//               )}
//             </div>
//           </div>
          
//           <button 
//             onClick={handleSubmit}
//             disabled={subtotal === 0 || orderMutation.isPending}
//             className="bg-brand-primary text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
//           >
//             {orderMutation.isPending ? <Loader2 className="animate-spin" size={16}/> : (
//               <>Place Order <ArrowRight size={16} /></>
//             )}
//           </button>
//         </div>
//       </div>

//       {showSuccess && (
//         <OrderSuccessScreen 
//           savings={finalSavings} 
//           onClose={() => setShowSuccess(false)} 
//         />
//       )}
//     </div>
//   );
// };
// // src/features/orders/pages/CreateOrderPage.tsx
// import { useState, useMemo } from 'react';
// // import { useNavigate } from 'react-router-dom';
// import { useQuery, useMutation } from '@tanstack/react-query';
// import { ordersService, type OrderPayload } from '../api/orders.service';
// import { adminService } from '@/features/admin/api/admin.service'; 
// // import { Button } from '@/components/ui/Button';
// // import { Input } from '@/components/ui/Input';
// import { Plus, Minus, Calendar, ShoppingBag, ArrowRight, Sparkles,Loader2 } from 'lucide-react';
// // import { cn } from '@/utils/cn';
// import { toast } from 'sonner';
// import { OrderSuccessScreen } from '../components/OrderSuccessScreen';

// export const CreateOrderPage = () => {
//   // const navigate = useNavigate();
//   const [cart, setCart] = useState<Record<number, number>>({});
//   const [pickupDate, setPickupDate] = useState('');
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [finalSavings, setFinalSavings] = useState(0);

//  const minPickupTime = useMemo(() => {
//   const now = new Date();
//   now.setHours(now.getHours() + 1); // Add the 1-hour buffer
  
//   // Format to: YYYY-MM-DDTHH:mm (Required by datetime-local)
//   const year = now.getFullYear();
//   const month = String(now.getMonth() + 1).padStart(2, '0');
//   const day = String(now.getDate()).padStart(2, '0');
//   const hours = String(now.getHours()).padStart(2, '0');
//   const minutes = String(now.getMinutes()).padStart(2, '0');
  
//   return `${year}-${month}-${day}T${hours}:${minutes}`;
// }, []);


//   const { data: items } = useQuery({
//     queryKey: ['laundryItems'],
//     queryFn: ordersService.getItems,
//   });

//   const { data: offers } = useQuery({
//     queryKey: ['activeOffers'],
//     queryFn: adminService.getOffers,
//   });

//   const orderMutation = useMutation({
//     mutationFn: ordersService.createOrder,
//     onSuccess: () => {
//       setFinalSavings(discount); 
//       setShowSuccess(true);
//     },
//   });

//   const { subtotal, appliedOffer, discount, total } = useMemo(() => {
//     if (!items) return { subtotal: 0, appliedOffer: null, discount: 0, total: 0 };
//     const sub = items.reduce((sum, item) => sum + (item.base_price * (cart[item.id] || 0)), 0);
//     const bestOffer = offers
//       ?.filter(o => o.is_active && sub >= o.min_order_amount)
//       .sort((a, b) => b.discount_amount - a.discount_amount)[0];
//     const disc = bestOffer ? bestOffer.discount_amount : 0;
    
//     return {
//       subtotal: sub,
//       appliedOffer: bestOffer || null,
//       discount: disc,
//       total: Math.max(0, sub - disc)
//     };
//   }, [cart, items, offers]);

//   const updateQuantity = (itemId: number, delta: number) => {
//     setCart((prev) => ({
//       ...prev,
//       [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
//     }));
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (subtotal === 0) return toast.error('Add at least one item');
//     if (!pickupDate) return toast.error('Please select a pickup schedule');

//     const selectedDateTime = new Date(pickupDate);
//     const now = new Date();
    
//     // Calculate the difference in minutes
//     const diffInMinutes = (selectedDateTime.getTime() - now.getTime()) / (1000 * 60);

//     if (diffInMinutes < 60) {
//       return toast.error("Pickup time must be at least 1 hour from now.");
//     }

//     const [datePart, timePart] = pickupDate.split('T');
//     const payload: OrderPayload = {
//       pickup_date: datePart,
//       pickup_time: timePart,
//       items: Object.entries(cart)
//         .filter(([_, qty]) => qty > 0)
//         .map(([id, qty]) => ({ item_id: Number(id), estimated_quantity: qty })),
//       notes: ""
//     };
//     orderMutation.mutate(payload);
//   };

//   return (
//     <div className="max-w-2xl mx-auto space-y-8 pb-12 px-4 pt-4">
//       <header>
//         <h1 className="text-3xl font-black text-slate-900 tracking-tighter">New Order</h1>
//         <p className="text-slate-500 font-medium">Professional care for your favorites.</p>
//       </header>

 

//       {/* Item Selection Section */}
//       <section className="space-y-4">
//         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
//           <ShoppingBag size={14} /> Service Menu
//         </h3>
//         <div className="grid gap-3">
//           {items?.map((item) => (
//             <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-primary/20 transition-all">
//               <div>
//                 <p className="font-bold text-slate-800 group-hover:text-brand-primary transition-colors">{item.name}</p>
//                 <p className="text-xs font-bold text-slate-400">AED {item.base_price} / pc</p>
//               </div>
//               <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl">
//                 <button onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-sm active:scale-90 transition-all"><Minus size={14}/></button>
//                 <span className="w-4 text-center font-black text-sm">{cart[item.id] || 0}</span>
//                 <button onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"><Plus size={14}/></button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>

 
//       {/* Schedule Section */}
//       <section className="space-y-4">
//         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
//           <Calendar size={14} /> When should we come?
//         </h3>
//         <div className="relative">
//           <input 
//             type="datetime-local" 
//             value={pickupDate}
//             // min={new Date().toISOString().slice(0, 16)} 
//             min={minPickupTime}
//             // onChange={(e) => setPickupDate(e.target.value)}
//             onChange={(e) => {
//     if (e.target.value < minPickupTime) {
//       toast.error("Pickup must be at least 1 hour from now");
//       return;
//     }
//     setPickupDate(e.target.value);
//   }}
//             className={`w-full p-5 bg-white border border-slate-100 rounded-[1.5rem] font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-sm ${
//               pickupDate ? "text-slate-900" : "text-slate-400"
//             }`}
//           />
          
//           {/* Custom Mobile-Friendly Placeholder */}
//           {!pickupDate && (
//             <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
//               {/* bg-white covers the browser's ugly default "dd/mm/yyyy" format while leaving the right-side calendar icon clickable on desktop */}
//               <span className="text-slate-400 font-bold bg-white pr-8">
//                 Tap to select date & time
//               </span>
//             </div>
//           )}
//         </div>
//       </section>
//            {/* FIXED: Order Summary moved to Top for Mobile Accessibility */}
//       <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl shadow-slate-200 space-y-4">
//         {appliedOffer && (
//           <div className="flex items-center justify-between bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 animate-pulse">
//              <div className="flex items-center gap-2">
//                <Sparkles size={14} className="text-yellow-400" />
//                <span className="text-[10px] font-black uppercase tracking-widest">Saving {appliedOffer.name}</span>
//              </div>
//              <span className="font-black text-xs">- AED {discount}</span>
//           </div>
//         )}

//         <div className="flex items-center justify-between">
//           <div className="text-white">
//             <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Estimated Total</span>
//             <div className="flex items-baseline gap-2">
//               <span className="text-3xl font-black tracking-tighter">AED {total}</span>
//               {discount > 0 && <span className="text-xs font-bold text-white/30 line-through">AED {subtotal}</span>}
//             </div>
//           </div>
          
//           <button 
//             onClick={handleSubmit}
//             disabled={subtotal === 0 || orderMutation.isPending}
//             className="bg-brand-primary text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
//           >
//             {orderMutation.isPending ? <Loader2 className="animate-spin" size={16}/> : (
//               <>Place Order <ArrowRight size={16} /></>
//             )}
//           </button>
//         </div>
//       </div>

//       {showSuccess && (
//         <OrderSuccessScreen 
//           savings={finalSavings} 
//           onClose={() => setShowSuccess(false)} 
//         />
//       )}
//     </div>
//   );
// };
