// src/features/orders/pages/CreateOrderPage.tsx
import { useState, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ordersService, type OrderPayload } from '../api/orders.service';
import { adminService } from '@/features/admin/api/admin.service'; 
// import { Button } from '@/components/ui/Button';
// import { Input } from '@/components/ui/Input';
import { Plus, Minus, Calendar, ShoppingBag, ArrowRight, Sparkles,Loader2 } from 'lucide-react';
// import { cn } from '@/utils/cn';
import { toast } from 'sonner';
import { OrderSuccessScreen } from '../components/OrderSuccessScreen';

export const CreateOrderPage = () => {
  // const navigate = useNavigate();
  const [cart, setCart] = useState<Record<number, number>>({});
  const [pickupDate, setPickupDate] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [finalSavings, setFinalSavings] = useState(0);

  const { data: items } = useQuery({
    queryKey: ['laundryItems'],
    queryFn: ordersService.getItems,
  });

  const { data: offers } = useQuery({
    queryKey: ['activeOffers'],
    queryFn: adminService.getOffers,
  });

  const orderMutation = useMutation({
    mutationFn: ordersService.createOrder,
    onSuccess: () => {
      setFinalSavings(discount); 
      setShowSuccess(true);
    },
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

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subtotal === 0) return toast.error('Add at least one item');
    if (!pickupDate) return toast.error('Please select a pickup schedule');

    const [datePart, timePart] = pickupDate.split('T');
    const payload: OrderPayload = {
      pickup_date: datePart,
      pickup_time: timePart,
      items: Object.entries(cart)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({ item_id: Number(id), estimated_quantity: qty })),
      notes: ""
    };
    orderMutation.mutate(payload);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12 px-4 pt-4">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">New Order</h1>
        <p className="text-slate-500 font-medium">Professional care for your favorites.</p>
      </header>

 

      {/* Item Selection Section */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <ShoppingBag size={14} /> Service Menu
        </h3>
        <div className="grid gap-3">
          {items?.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-primary/20 transition-all">
              <div>
                <p className="font-bold text-slate-800 group-hover:text-brand-primary transition-colors">{item.name}</p>
                <p className="text-xs font-bold text-slate-400">AED {item.base_price} / pc</p>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl">
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
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <Calendar size={14} /> When should we come?
        </h3>
        <input 
          type="datetime-local" 
          value={pickupDate}
          min={new Date().toISOString().slice(0, 16)} 
          onChange={(e) => setPickupDate(e.target.value)}
          className="w-full p-5 bg-white border border-slate-100 rounded-[1.5rem] font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-sm"
        />
      </section>
           {/* FIXED: Order Summary moved to Top for Mobile Accessibility */}
      <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl shadow-slate-200 space-y-4">
        {appliedOffer && (
          <div className="flex items-center justify-between bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 animate-pulse">
             <div className="flex items-center gap-2">
               <Sparkles size={14} className="text-yellow-400" />
               <span className="text-[10px] font-black uppercase tracking-widest">Saving {appliedOffer.name}</span>
             </div>
             <span className="font-black text-xs">- AED {discount}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-white">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Estimated Total</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tighter">AED {total}</span>
              {discount > 0 && <span className="text-xs font-bold text-white/30 line-through">AED {subtotal}</span>}
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

      {showSuccess && (
        <OrderSuccessScreen 
          savings={finalSavings} 
          onClose={() => setShowSuccess(false)} 
        />
      )}
    </div>
  );
};
// // src/features/orders/pages/CreateOrderPage.tsx
// import { useState, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useQuery, useMutation } from '@tanstack/react-query';
// import { ordersService, type OrderPayload } from '../api/orders.service';
// import { adminService } from '@/features/admin/api/admin.service'; 
// import { Button } from '@/components/ui/Button';
// import { Input } from '@/components/ui/Input';
// import { Plus, Minus, Calendar, ShoppingBag, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
// import { cn } from '@/utils/cn';
// import { toast } from 'sonner';
// import { OrderSuccessScreen } from '../components/OrderSuccessScreen';

// export const CreateOrderPage = () => {
//   const navigate = useNavigate();
//   const [cart, setCart] = useState<Record<number, number>>({});
//   const [pickupDate, setPickupDate] = useState('');
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [finalSavings, setFinalSavings] = useState(0);

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

//       {/* FIXED: Order Summary moved to Top for Mobile Accessibility */}
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
//         <input 
//           type="datetime-local" 
//           value={pickupDate}
//           min={new Date().toISOString().slice(0, 16)} 
//           onChange={(e) => setPickupDate(e.target.value)}
//           className="w-full p-5 bg-white border border-slate-100 rounded-[1.5rem] font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-sm"
//         />
//       </section>

//       {showSuccess && (
//         <OrderSuccessScreen 
//           savings={finalSavings} 
//           onClose={() => setShowSuccess(false)} 
//         />
//       )}
//     </div>
//   );
// };
// import { useState, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useQuery, useMutation } from '@tanstack/react-query';
// import { ordersService, type OrderPayload } from '../api/orders.service';
// import { adminService } from '@/features/admin/api/admin.service'; // To fetch offers
// import { Button } from '@/components/ui/Button';
// import { Input } from '@/components/ui/Input';
// import { Plus, Minus, Calendar, ShoppingBag, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
// import { cn } from '@/utils/cn';
// import { toast } from 'sonner';
// import { OrderSuccessScreen } from '../components/OrderSuccessScreen';

// export const CreateOrderPage = () => {
//   const navigate = useNavigate();
//   const [cart, setCart] = useState<Record<number, number>>({});
//   const [pickupDate, setPickupDate] = useState('');

//   // 1. Fetch Data (Pricing + Offers)
//   const { data: items } = useQuery({
//     queryKey: ['laundryItems'],
//     queryFn: ordersService.getItems,
//   });

//   const { data: offers } = useQuery({
//     queryKey: ['activeOffers'],
//     queryFn: adminService.getOffers,
//   });


//   const [showSuccess, setShowSuccess] = useState(false);
// const [finalSavings, setFinalSavings] = useState(0);

//   const orderMutation = useMutation({
//     mutationFn: ordersService.createOrder,
//     onSuccess: () => {
//       setFinalSavings(discount); // Capture the discount we calculated
//     setShowSuccess(true);
//       // toast.success("Order placed successfully! We're on our way.");
//       // navigate('/orders');
      
//     },
//   });

//   // 2. Business Logic: Price & Offer Calculation
//   const { subtotal, appliedOffer, discount, total } = useMemo(() => {
//     if (!items) return { subtotal: 0, appliedOffer: null, discount: 0, total: 0 };

//     const sub = items.reduce((sum, item) => sum + (item.base_price * (cart[item.id] || 0)), 0);
    
//     // Find the best applicable offer (highest discount where min_order met)
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
//     <div className="max-w-2xl mx-auto space-y-8 pb-40 px-4 pt-4">
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
//         <input 
//           type="datetime-local" 
//           value={pickupDate}
//           min={new Date().toISOString().slice(0, 16)} // Frontend "Yesterday" check
//           onChange={(e) => setPickupDate(e.target.value)}
//           className="w-full p-5 bg-white border border-slate-100 rounded-[1.5rem] font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-sm"
//         />
//       </section>

//       {/* THE REWARD SUMMARY: Sticky Bottom */}
//       <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50">
//         <div className="max-w-2xl mx-auto space-y-4">
          
//           {/* Animated Reward Badge */}
//           {appliedOffer && (
//             <div className="flex items-center justify-between bg-emerald-500 text-white px-5 py-3 rounded-2xl animate-in slide-in-from-bottom-4 duration-500 shadow-lg shadow-emerald-200">
//                <div className="flex items-center gap-2">
//                  <Sparkles size={18} fill="currentColor" className="animate-pulse" />
//                  <span className="text-xs font-black uppercase tracking-widest">Saving {appliedOffer.name}</span>
//                </div>
//                <span className="font-black text-sm">- AED {discount}</span>
//             </div>
//           )}

//           <div className="flex items-center justify-between gap-6">
//             <div className="flex flex-col">
//               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Estimate</span>
//               <div className="flex items-baseline gap-2">
//                 <span className="text-3xl font-black text-slate-900 tracking-tighter">AED {total}</span>
//                 {discount > 0 && <span className="text-xs font-bold text-slate-400 line-through">AED {subtotal}</span>}
//               </div>
//             </div>
            
//             <button 
//               onClick={handleSubmit}
//               disabled={subtotal === 0 || orderMutation.isPending}
//               className="flex-1 bg-slate-900 hover:bg-brand-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
//             >
//               {orderMutation.isPending ? "Confirming..." : (
//                 <>Place Order <ArrowRight size={16} /></>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//       {showSuccess && (
//   <OrderSuccessScreen 
//     savings={finalSavings} 
//     onClose={() => setShowSuccess(false)} 
//   />
// )}
//     </div>
//   );
// };
// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useQuery, useMutation } from '@tanstack/react-query';
// import { ordersService,type LaundryItem, type OrderPayload } from '../api/orders.service';
// import { Button } from '@/components/ui/Button';
// import { Input } from '@/components/ui/Input';
// import { Plus, Minus, Calendar, ShoppingBag, ArrowRight } from 'lucide-react';
// import { cn } from '@/utils/cn';

// export const CreateOrderPage = () => {
//   const navigate = useNavigate();
//   const [cart, setCart] = useState<Record<number, number>>({});
//   const [pickupDate, setPickupDate] = useState('');

//   // 1. Fetch Laundry Items (Price List)
//   const { data: items, isLoading } = useQuery({
//     queryKey: ['laundryItems'],
//     queryFn: ordersService.getItems,
//   });

//   // 2. Setup Order Mutation
//   const orderMutation = useMutation({
//     mutationFn: ordersService.createOrder,
//     retry: 0,
//     onSuccess: () => {
//       navigate('/orders'); // Take user to history on success
//     },
//   });

//   const updateQuantity = (itemId: number, delta: number) => {
//     setCart((prev) => {
//       const current = prev[itemId] || 0;
//       const next = Math.max(0, current + delta);
//       return { ...prev, [itemId]: next };
//     });
//   };

//   const calculateTotal = () => {
//     if (!items) return 0;
//     return items.reduce((sum, item) => {
//       return sum + (item.base_price * (cart[item.id] || 0));
//     }, 0);
//   };

// const handleSubmit = (e: React.FormEvent) => {
//   e.preventDefault();
  
//   // Basic validation
//   if (Object.keys(cart).length === 0) return alert('Add at least one item');
//   if (!pickupDate) return alert('Please select a pickup schedule');

//   // Logic to split the '2026-03-18T15:30' format into two parts
//   const [datePart, timePart] = pickupDate.split('T');

//   const payload: OrderPayload = {
//     // 1. Send the date part (The backend will parse this into a DateTime)
//     pickup_date: datePart, 
    
//     // 2. Send the time part as a simple string (e.g., "15:30")
//     pickup_time: timePart,
    
//     // 3. Map the items
//     items: Object.entries(cart)
//       .filter(([_, qty]) => qty > 0)
//       .map(([id, qty]) => ({
//         item_id: Number(id),
//         estimated_quantity: qty
//       })),
      
//     notes: "" // Optional: you can add a textarea for this later
//   };

//   console.log("Sending Payload:", payload); // Debug to verify structure
//   orderMutation.mutate(payload);
// };
// //   const handleSubmit = (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (Object.keys(cart).length === 0) return alert('Add at least one item');
    
// //     const payload = {
// //       pickup_date: new Date(pickupDate).toISOString(),
// //       items: Object.entries(cart)
// //         .filter(([_, qty]) => qty > 0)
// //         .map(([id, qty]) => ({
// //           item_id: Number(id),
// //           estimated_quantity: qty
// //         }))
// //     };
    
// //     orderMutation.mutate(payload);
// //   };

//   if (isLoading) return <div className="p-8 text-center">Loading price list...</div>;

//   return (
//     <div className="max-w-2xl mx-auto space-y-8 pb-32">
//       <header>
//         <h1 className="text-2xl font-bold text-slate-900">Book Laundry</h1>
//         <p className="text-slate-500 text-sm">Select items and schedule your pickup.</p>
//       </header>

//       <div className="space-y-4">
//         <h3 className="font-semibold text-slate-800 flex items-center gap-2">
//           <ShoppingBag size={18} className="text-brand-primary" />
//           Select Items (Estimate)
//         </h3>
        
//         <div className="grid gap-3">
//           {items?.map((item) => (
//             <div key={item.id} className="bg-white p-4 rounded-premium border border-slate-100 shadow-soft flex items-center justify-between">
//               <div>
//                 <p className="font-medium text-slate-800">{item.name}</p>
//                 <p className="text-sm text-slate-500">{item.base_price} AED / piece</p>
//               </div>
              
//               <div className="flex items-center gap-3">
//                 <button 
//                   onClick={() => updateQuantity(item.id, -1)}
//                   className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-all"
//                 >
//                   <Minus size={16} />
//                 </button>
//                 <span className="w-6 text-center font-bold">{cart[item.id] || 0}</span>
//                 <button 
//                   onClick={() => updateQuantity(item.id, 1)}
//                   className="h-8 w-8 rounded-full bg-brand-primary text-white flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all shadow-sm"
//                 >
//                   <Plus size={16} />
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="space-y-4">
//         <h3 className="font-semibold text-slate-800 flex items-center gap-2">
//           <Calendar size={18} className="text-brand-primary" />
//           Pickup Schedule
//         </h3>
//         <Input 
//           type="datetime-local" 
//           value={pickupDate}
//           onChange={(e) => setPickupDate(e.target.value)}
//           required
//         />
//       </div>

//       {/* Sticky Bottom Summary Bar (Mobile-first UX) */}
//       <div className="fixed bottom-16 md:bottom-8 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-30 md:relative md:bg-transparent md:border-none md:p-0">
//         <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
//           <div className="flex flex-col">
//             <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Est. Total</span>
//             <span className="text-xl font-bold text-slate-900">{calculateTotal()} AED</span>
//           </div>
//           <Button 
//             onClick={handleSubmit}
//             className="flex-1 sm:flex-none px-8" 
//             isLoading={orderMutation.isPending}
//             icon={ArrowRight}
//           >
//             Place Order
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };