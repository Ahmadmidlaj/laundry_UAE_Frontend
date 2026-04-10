// src/features/orders/pages/OrderDetailPage.tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { formatSafeDate, formatOrderId } from '@/utils/formatters';
import { OrderTracker } from '../components/OrderTracker';
import { Clock } from 'lucide-react'; 

// Helper function to calculate the 1-hour window dynamically
const getPickupWindow = (timeStr?: string) => {
  if (!timeStr) return "Pending";
  try {
    const [hourStr, minStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const min = parseInt(minStr, 10);
    
    const formatAMPM = (h: number, m: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      const displayM = m < 10 ? `0${m}` : m;
      return `${displayH}:${displayM} ${ampm}`;
    };

    const startTime = formatAMPM(hour, min);
    const endHour = (hour + 1) % 24; // Handles 23:00 wrapping to 00:00
    const endTime = formatAMPM(endHour, min);

    return `${startTime} - ${endTime}`;
  } catch (e) {
    return timeStr; // Fallback just in case
  }
};

export const OrderDetailPage = () => {
  const { id } = useParams();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data;
    },
    enabled: !!id && id !== 'undefined',
    refetchInterval: 5000, 
  });

  if (isLoading) return <div className="p-10 text-center font-medium text-slate-500">Loading Order...</div>;
  if (error || !order) return <div className="p-10 text-center text-red-500 font-bold">Order not found.</div>;

  return (
    <div className="relative min-h-screen">
      {/* 1. BACKGROUND LAYER */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center opacity-30 brightness-75 pointer-events-none"
        style={{ backgroundImage: "url('/images/bg6.jpg')" }}
      />

      {/* 2. CONTENT LAYER */}
      <div className="relative z-10 max-w-3xl mx-auto p-4 md:p-8 space-y-6 pb-20">
        
        {/* Header Section (Upgraded to Glassmorphism) */}
        <div className="flex justify-between items-start bg-white/60 backdrop-blur-md p-5 rounded-3xl border border-white shadow-sm mt-2">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{formatOrderId(order.id)}</h1>
            <p className="text-slate-500 text-sm font-medium">
              Placed on: {order.created_at ? formatSafeDate(order.created_at) : 'Processing...'}
            </p>
          </div>
          
          {/* UPDATED: Dynamic Status Badge Colors */}
          <div className={`px-4 py-2 bg-white rounded-full font-black text-xs uppercase tracking-widest shadow-sm border ${
            order.status === 'DELIVERED' 
              ? 'text-emerald-500 border-emerald-100' 
              : order.status === 'CANCELLED'
                ? 'text-red-500 border-red-100'
                : 'text-brand-primary border-brand-primary/10'
          }`}>
            {order.status.replace('_', ' ')}
          </div>
        </div>

        {/* Dynamic Pickup Window Banner */}
        {['NEW_ORDER', 'PICKUP_IN_PROGRESS'].includes(order.status) && (
          <div className="bg-brand-primary/10 backdrop-blur-md border border-brand-primary/20 p-5 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center text-brand-primary shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-0.5">Expected Pickup Time</p>
              <p className="text-lg font-black text-slate-900 tracking-tight">
                {order.pickup_date ? new Date(order.pickup_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ''} 
                {' • '}
                {getPickupWindow(order.pickup_time)}
              </p>
            </div>
          </div>
        )}

        {/* Tracker Section */}
        <OrderTracker currentStatus={order.status} />

        {/* Customer & Address Card (Upgraded to Glassmorphism) */}
        <div className="p-6 grid md:grid-cols-2 gap-6 bg-white/90 backdrop-blur-xl rounded-3xl border border-white shadow-sm">
          <div>
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Customer Details</h3>
            <p className="font-bold text-slate-900">{order.customer?.full_name || 'Guest'}</p>
            <p className="text-slate-500 text-sm font-medium">{order.customer?.mobile}</p>
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Delivery Address</h3>
            <p className="text-slate-700 text-sm font-bold leading-relaxed">
              {order.customer?.building_name},<br />
              Flat {order.customer?.flat_number}
            </p>
          </div>
        </div>

        {/* Items Summary Section (Upgraded to Glassmorphism) */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden border border-white">
          <div className="p-5 bg-white/50 border-b border-slate-100/50 flex justify-between items-center">
            <span className="font-black text-slate-900 text-xs uppercase tracking-widest">Order Summary</span>
            <span className="text-[10px] font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
              {order.items?.length || 0} ITEMS
            </span>
          </div>
          
          <div className="divide-y divide-slate-100/50">
            {order.items && order.items.length > 0 ? (
              order.items.map((item: any, idx: number) => {
                const displayQty = order.status === 'NEW_ORDER' 
                  ? item.estimated_quantity 
                  : item.final_quantity;

                return (
                  <div key={idx} className="p-5 flex justify-between items-center hover:bg-white transition-colors">
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-bold text-sm">
                        {item.item?.name || "Standard Item"}
                      </span>
                      <span className="text-slate-500 text-xs font-bold">
                        QTY: {displayQty} × AED {item.unit_price.toFixed(2)}
                      </span>
                    </div>
                    <span className="font-black text-slate-900 text-sm">
                      AED {(displayQty * item.unit_price).toFixed(2)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center text-slate-400 text-sm italic">
                No items recorded.
              </div>
            )}
          </div>

          {/* Total Calculation Section */}
          <div className="p-6 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex flex-col relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {order.status === 'NEW_ORDER' ? 'Estimated Total' : 'Amount to Pay'}
              </span>
              <span className="text-xs text-slate-500 font-bold">VAT Inclusive</span>
            </div>
            <div className="text-right relative z-10">
              <span className="block text-2xl font-black tracking-tighter">
                AED {order.final_price > 0 ? order.final_price.toFixed(2) : order.estimated_price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
// // src/features/orders/pages/OrderDetailPage.tsx
// import { useParams } from 'react-router-dom';
// import { useQuery } from '@tanstack/react-query';
// import api from '@/api/axios';
// import { formatSafeDate, formatOrderId } from '@/utils/formatters';
// import { OrderTracker } from '../components/OrderTracker';
// import { Clock } from 'lucide-react'; 

// // Helper function to calculate the 1-hour window dynamically
// const getPickupWindow = (timeStr?: string) => {
//   if (!timeStr) return "Pending";
//   try {
//     const [hourStr, minStr] = timeStr.split(':');
//     const hour = parseInt(hourStr, 10);
//     const min = parseInt(minStr, 10);
    
//     const formatAMPM = (h: number, m: number) => {
//       const ampm = h >= 12 ? 'PM' : 'AM';
//       const displayH = h % 12 || 12;
//       const displayM = m < 10 ? `0${m}` : m;
//       return `${displayH}:${displayM} ${ampm}`;
//     };

//     const startTime = formatAMPM(hour, min);
//     const endHour = (hour + 1) % 24; // Handles 23:00 wrapping to 00:00
//     const endTime = formatAMPM(endHour, min);

//     return `${startTime} - ${endTime}`;
//   } catch (e) {
//     return timeStr; // Fallback just in case
//   }
// };

// export const OrderDetailPage = () => {
//   const { id } = useParams();

//   const { data: order, isLoading, error } = useQuery({
//     queryKey: ['order', id],
//     queryFn: async () => {
//       const { data } = await api.get(`/orders/${id}`);
//       return data;
//     },
//     enabled: !!id && id !== 'undefined',
//     refetchInterval: 5000, 
//   });

//   if (isLoading) return <div className="p-10 text-center font-medium text-slate-500">Loading Order...</div>;
//   if (error || !order) return <div className="p-10 text-center text-red-500 font-bold">Order not found.</div>;

//   return (
//     <div className="relative min-h-screen">
//       {/* 1. BACKGROUND LAYER */}
//       <div 
//         className="fixed inset-0 z-0 bg-cover bg-center opacity-30 brightness-75 pointer-events-none"
//         style={{ backgroundImage: "url('/images/bg6.jpg')" }}
//       />

//       {/* 2. CONTENT LAYER */}
//       <div className="relative z-10 max-w-3xl mx-auto p-4 md:p-8 space-y-6 pb-20">
        
//         {/* Header Section (Upgraded to Glassmorphism) */}
//         <div className="flex justify-between items-start bg-white/60 backdrop-blur-md p-5 rounded-3xl border border-white shadow-sm mt-2">
//           <div>
//             <h1 className="text-2xl font-black text-slate-900 tracking-tight">{formatOrderId(order.id)}</h1>
//             <p className="text-slate-500 text-sm font-medium">
//               Placed on: {order.created_at ? formatSafeDate(order.created_at) : 'Processing...'}
//             </p>
//           </div>
//           <div className="px-4 py-2 bg-white text-brand-primary rounded-full font-black text-xs uppercase tracking-widest shadow-sm border border-brand-primary/10">
//             {order.status.replace('_', ' ')}
//           </div>
//         </div>

//         {/* Dynamic Pickup Window Banner */}
//         {['NEW_ORDER', 'PICKUP_IN_PROGRESS'].includes(order.status) && (
//           <div className="bg-brand-primary/10 backdrop-blur-md border border-brand-primary/20 p-5 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
//             <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center text-brand-primary shrink-0">
//               <Clock size={24} />
//             </div>
//             <div>
//               <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-0.5">Expected Pickup Time</p>
//               <p className="text-lg font-black text-slate-900 tracking-tight">
//                 {order.pickup_date ? new Date(order.pickup_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ''} 
//                 {' • '}
//                 {getPickupWindow(order.pickup_time)}
//               </p>
//             </div>
//           </div>
//         )}

//         {/* Tracker Section */}
//         <OrderTracker currentStatus={order.status} />

//         {/* Customer & Address Card (Upgraded to Glassmorphism) */}
//         <div className="p-6 grid md:grid-cols-2 gap-6 bg-white/90 backdrop-blur-xl rounded-3xl border border-white shadow-sm">
//           <div>
//             <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Customer Details</h3>
//             <p className="font-bold text-slate-900">{order.customer?.full_name || 'Guest'}</p>
//             <p className="text-slate-500 text-sm font-medium">{order.customer?.mobile}</p>
//           </div>
//           <div>
//             <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Delivery Address</h3>
//             <p className="text-slate-700 text-sm font-bold leading-relaxed">
//               {order.customer?.building_name},<br />
//               Flat {order.customer?.flat_number}
//             </p>
//           </div>
//         </div>

//         {/* Items Summary Section (Upgraded to Glassmorphism) */}
//         <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden border border-white">
//           <div className="p-5 bg-white/50 border-b border-slate-100/50 flex justify-between items-center">
//             <span className="font-black text-slate-900 text-xs uppercase tracking-widest">Order Summary</span>
//             <span className="text-[10px] font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
//               {order.items?.length || 0} ITEMS
//             </span>
//           </div>
          
//           <div className="divide-y divide-slate-100/50">
//             {order.items && order.items.length > 0 ? (
//               order.items.map((item: any, idx: number) => {
//                 const displayQty = order.status === 'NEW_ORDER' 
//                   ? item.estimated_quantity 
//                   : item.final_quantity;

//                 return (
//                   <div key={idx} className="p-5 flex justify-between items-center hover:bg-white transition-colors">
//                     <div className="flex flex-col">
//                       <span className="text-slate-900 font-bold text-sm">
//                         {item.item?.name || "Standard Item"}
//                       </span>
//                       <span className="text-slate-500 text-xs font-bold">
//                         QTY: {displayQty} × AED {item.unit_price.toFixed(2)}
//                       </span>
//                     </div>
//                     <span className="font-black text-slate-900 text-sm">
//                       AED {(displayQty * item.unit_price).toFixed(2)}
//                     </span>
//                   </div>
//                 );
//               })
//             ) : (
//               <div className="p-10 text-center text-slate-400 text-sm italic">
//                 No items recorded.
//               </div>
//             )}
//           </div>

//           {/* Total Calculation Section */}
//           <div className="p-6 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
//             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none"></div>
//             <div className="flex flex-col relative z-10">
//               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
//                 {order.status === 'NEW_ORDER' ? 'Estimated Total' : 'Amount to Pay'}
//               </span>
//               <span className="text-xs text-slate-500 font-bold">VAT Inclusive</span>
//             </div>
//             <div className="text-right relative z-10">
//               <span className="block text-2xl font-black tracking-tighter">
//                 AED {order.final_price > 0 ? order.final_price.toFixed(2) : order.estimated_price.toFixed(2)}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
// // src/features/orders/pages/OrderDetailPage.tsx
// import { useParams } from 'react-router-dom';
// import { useQuery } from '@tanstack/react-query';
// import api from '@/api/axios';
// import { formatSafeDate, formatOrderId } from '@/utils/formatters';
// import { OrderTracker } from '../components/OrderTracker';
// import { Clock } from 'lucide-react'; // <-- Added Clock Icon

// // NEW: Helper function to calculate the 1-hour window dynamically
// const getPickupWindow = (timeStr?: string) => {
//   if (!timeStr) return "Pending";
//   try {
//     const [hourStr, minStr] = timeStr.split(':');
//     const hour = parseInt(hourStr, 10);
//     const min = parseInt(minStr, 10);
    
//     const formatAMPM = (h: number, m: number) => {
//       const ampm = h >= 12 ? 'PM' : 'AM';
//       const displayH = h % 12 || 12;
//       const displayM = m < 10 ? `0${m}` : m;
//       return `${displayH}:${displayM} ${ampm}`;
//     };

//     const startTime = formatAMPM(hour, min);
//     const endHour = hour + 1; // Add 1 hour
//     const endTime = formatAMPM(endHour, min);

//     return `${startTime} - ${endTime}`;
//   } catch (e) {
//     return timeStr; // Fallback just in case
//   }
// };

// export const OrderDetailPage = () => {
//   const { id } = useParams();

//   const { data: order, isLoading, error } = useQuery({
//     queryKey: ['order', id],
//     queryFn: async () => {
//       const { data } = await api.get(`/orders/${id}`);
//       return data;
//     },
//     enabled: !!id && id !== 'undefined',
//     refetchInterval: 5000, 
//   });

//   if (isLoading) return <div className="p-10 text-center font-medium text-slate-500">Loading Order...</div>;
//   if (error || !order) return <div className="p-10 text-center text-red-500 font-bold">Order not found.</div>;

//   return (
//     <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 pb-20">
//       {/* Header Section */}
//       <div className="flex justify-between items-start">
//         <div>
//           <h1 className="text-2xl font-black text-slate-900 tracking-tight">{formatOrderId(order.id)}</h1>
//           <p className="text-slate-500 text-sm font-medium">
//             Placed on: {order.created_at ? formatSafeDate(order.created_at) : 'Processing...'}
//           </p>
//         </div>
//         <div className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-full font-black text-xs uppercase tracking-widest">
//           {order.status.replace('_', ' ')}
//         </div>
//       </div>

//       {/* NEW: Dynamic Pickup Window Banner */}
//       {['NEW_ORDER', 'PICKUP_IN_PROGRESS'].includes(order.status) && (
//         <div className="bg-brand-primary/5 border border-brand-primary/20 p-5 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
//           <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center text-brand-primary shrink-0">
//             <Clock size={24} />
//           </div>
//           <div>
//             <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-0.5">Expected Pickup Time</p>
//             <p className="text-lg font-black text-slate-900 tracking-tight">
//               {order.pickup_date ? new Date(order.pickup_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ''} 
//               {' • '}
//               {getPickupWindow(order.pickup_time)}
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Tracker Section */}
//       <OrderTracker currentStatus={order.status} />

//       {/* Customer & Address Card */}
//       <div className="p-6 grid md:grid-cols-2 gap-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
//         <div>
//           <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Customer Details</h3>
//           <p className="font-bold text-slate-900">{order.customer?.full_name || 'Guest'}</p>
//           <p className="text-slate-500 text-sm font-medium">{order.customer?.mobile}</p>
//         </div>
//         <div>
//           <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Delivery Address</h3>
//           <p className="text-slate-700 text-sm font-bold leading-relaxed">
//             {order.customer?.building_name},<br />
//             Flat {order.customer?.flat_number}
//           </p>
//         </div>
//       </div>

//       {/* Items Summary Section */}
//       <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-100">
//         <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
//           <span className="font-black text-slate-900 text-xs uppercase tracking-widest">Order Summary</span>
//           <span className="text-[10px] font-bold text-slate-400">
//             {order.items?.length || 0} ITEMS
//           </span>
//         </div>
        
//         <div className="divide-y divide-slate-50">
//           {order.items && order.items.length > 0 ? (
//             order.items.map((item: any, idx: number) => {
//               const displayQty = order.status === 'NEW_ORDER' 
//                 ? item.estimated_quantity 
//                 : item.final_quantity;

//               return (
//                 <div key={idx} className="p-5 flex justify-between items-center hover:bg-slate-50/30 transition-colors">
//                   <div className="flex flex-col">
//                     <span className="text-slate-900 font-bold text-sm">
//                       {item.item?.name || "Standard Item"}
//                     </span>
//                     <span className="text-slate-400 text-xs font-bold">
//                       QTY: {displayQty} × AED {item.unit_price.toFixed(2)}
//                     </span>
//                   </div>
//                   <span className="font-black text-slate-900 text-sm">
//                     AED {(displayQty * item.unit_price).toFixed(2)}
//                   </span>
//                 </div>
//               );
//             })
//           ) : (
//             <div className="p-10 text-center text-slate-400 text-sm italic">
//               No items recorded.
//             </div>
//           )}
//         </div>

//         {/* Total Calculation Section */}
//         <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
//           <div className="flex flex-col">
//             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
//               {order.status === 'NEW_ORDER' ? 'Estimated Total' : 'Amount to Pay'}
//             </span>
//             <span className="text-xs text-slate-500 font-bold">VAT Inclusive</span>
//           </div>
//           <div className="text-right">
//             <span className="block text-2xl font-black tracking-tighter">
//               AED {order.final_price > 0 ? order.final_price.toFixed(2) : order.estimated_price.toFixed(2)}
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
// import { useParams } from 'react-router-dom';
// import { useQuery } from '@tanstack/react-query';
// import api from '@/api/axios';
// import { formatSafeDate, formatOrderId } from '@/utils/formatters';
// import { OrderTracker } from '../components/OrderTracker';

// export const OrderDetailPage = () => {
//   const { id } = useParams();

//   const { data: order, isLoading, error } = useQuery({
//     queryKey: ['order', id],
//     queryFn: async () => {
//       const { data } = await api.get(`/orders/${id}`);
//       return data;
//     },
//     enabled: !!id && id !== 'undefined',
//     refetchInterval: 5000, // Auto-updates when driver confirms pickup
//   });

//   if (isLoading) return <div className="p-10 text-center font-medium text-slate-500">Loading Order...</div>;
//   if (error || !order) return <div className="p-10 text-center text-red-500 font-bold">Order not found.</div>;

//   return (
//     <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 pb-20">
//       {/* Header Section */}
//       <div className="flex justify-between items-start">
//         <div>
//           <h1 className="text-2xl font-black text-slate-900 tracking-tight">{formatOrderId(order.id)}</h1>
//           <p className="text-slate-500 text-sm font-medium">
//             Placed on: {order.created_at ? formatSafeDate(order.created_at) : 'Processing...'}
//           </p>
//         </div>
//         <div className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-full font-black text-xs uppercase tracking-widest">
//           {order.status.replace('_', ' ')}
//         </div>
//       </div>

//       {/* Tracker Section - Uses the smart 3-step tracker */}
//       <OrderTracker currentStatus={order.status} />

//       {/* Customer & Address Card */}
//       <div className="p-6 grid md:grid-cols-2 gap-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
//         <div>
//           <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Customer Details</h3>
//           <p className="font-bold text-slate-900">{order.customer?.full_name || 'Guest'}</p>
//           <p className="text-slate-500 text-sm font-medium">{order.customer?.mobile}</p>
//         </div>
//         <div>
//           <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Delivery Address</h3>
//           <p className="text-slate-700 text-sm font-bold leading-relaxed">
//             {order.customer?.building_name},<br />
//             Flat {order.customer?.flat_number}
//           </p>
//         </div>
//       </div>

//       {/* Items Summary Section */}
//       <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-100">
//         <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
//           <span className="font-black text-slate-900 text-xs uppercase tracking-widest">Order Summary</span>
//           <span className="text-[10px] font-bold text-slate-400">
//             {order.items?.length || 0} ITEMS
//           </span>
//         </div>
        
//         <div className="divide-y divide-slate-50">
//           {order.items && order.items.length > 0 ? (
//             order.items.map((item: any, idx: number) => {
//               // LOGIC: Use estimated qty for new orders, actual qty for processed orders
//               const displayQty = order.status === 'NEW_ORDER' 
//                 ? item.estimated_quantity 
//                 : item.final_quantity;

//               return (
//                 <div key={idx} className="p-5 flex justify-between items-center hover:bg-slate-50/30 transition-colors">
//                   <div className="flex flex-col">
//                     <span className="text-slate-900 font-bold text-sm">
//                       {item.item?.name || "Standard Item"}
//                     </span>
//                     <span className="text-slate-400 text-xs font-bold">
//                       QTY: {displayQty} × AED {item.unit_price.toFixed(2)}
//                     </span>
//                   </div>
//                   <span className="font-black text-slate-900 text-sm">
//                     AED {(displayQty * item.unit_price).toFixed(2)}
//                   </span>
//                 </div>
//               );
//             })
//           ) : (
//             <div className="p-10 text-center text-slate-400 text-sm italic">
//               No items recorded.
//             </div>
//           )}
//         </div>

//         {/* Total Calculation Section */}
//         <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
//           <div className="flex flex-col">
//             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
//               {order.status === 'NEW_ORDER' ? 'Estimated Total' : 'Amount to Pay'}
//             </span>
//             <span className="text-xs text-slate-500 font-bold">VAT Inclusive</span>
//           </div>
//           <div className="text-right">
//             <span className="block text-2xl font-black tracking-tighter">
//               AED {order.final_price > 0 ? order.final_price.toFixed(2) : order.estimated_price.toFixed(2)}
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// import { useParams } from 'react-router-dom';
// import { useQuery } from '@tanstack/react-query';
// import api from '@/api/axios';
// import { formatSafeDate, formatOrderId } from '@/utils/formatters';
// import { OrderTracker } from '../components/OrderTracker'; // Component we created earlier
// // import { Card } from '@/components/ui/card';


// const getStatusStep = (status: string): number => {
//     switch(status) {
//       case 'NEW_ORDER': return 1;
//       case 'PICKED_UP': return 2;
//       case 'DELIVERED': return 3;
//       default: return 1;
//     }
//   };

// export const OrderDetailPage = () => {
//   const { id } = useParams();

//   const { data: order, isLoading, error } = useQuery({
//     queryKey: ['order', id],
//     queryFn: async () => {
//       const { data } = await api.get(`/orders/${id}`);
//       return data;
//     },
//     enabled: !!id && id !== 'undefined', // FIX: Prevents the 404 spam
//     refetchInterval: 5000,
//   });

//   if (isLoading) return <div className="p-10 text-center">Loading Order...</div>;
//   if (error || !order) return <div className="p-10 text-center text-red-500">Order not found.</div>;

//   const currentStep = getStatusStep(order.status);

//   return (
//     <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
//       {/* Header Section */}
//       <div className="flex justify-between items-start">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-900">{formatOrderId(order.id)}</h1>
//           <p className="text-slate-500 text-sm">
//             Placed on: {order.created_at ? formatSafeDate(order.created_at) : 'Processing...'}
//           </p>
//         </div>
//         <div className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-full font-bold text-sm">
//           {order.status.replace('_', ' ')}
//         </div>
//       </div>

//       {/* Tracker Section */}
//       {/* <OrderTracker currentStatus={order.status} /> */}
//       <OrderTracker 
//         steps={['Order Placed', 'Picked Up', 'Delivered']} 
//         currentStep={getStatusStep(order.status)} 
//       />

//       {/* Customer & Address Card */}
//       <div className="p-6 grid md:grid-cols-2 gap-6 border-none shadow-sm bg-white rounded-2xl">
//         <div>
//           <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Customer Details</h3>
//           <p className="font-bold text-slate-800">{order.customer?.full_name || 'Guest'}</p>
//           <p className="text-slate-600 text-sm">{order.customer?.mobile}</p>
//         </div>
//         <div>
//           <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Delivery Address</h3>
//           <p className="text-slate-700 text-sm">
//             {order.customer?.building_name}, Flat {order.customer?.flat_number}
//           </p>
//         </div>
//       </div>

//  {/* Items Summary Section */}
//       <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
//         <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">
//           Order Summary
//         </div>
//         <div className="divide-y divide-slate-50">
          
//           {/* Added safety check for empty items */}
//           {order.items && order.items.length > 0 ? (
//             order.items.map((item: any, idx: number) => (
//               <div key={idx} className="p-4 flex justify-between items-center">
//                 <span className="text-slate-700 font-medium">
//                   {/* FIX: Properly accessing the nested item name */}
//                   {item.item?.name || "Standard Item"} 
//                   <span className="text-slate-400 ml-2">
//                     x {item.final_quantity > 0 ? item.final_quantity : item.estimated_quantity}
//                   </span>
//                 </span>
//                 <span className="font-bold text-slate-900">AED {item.unit_price}</span>
//               </div>
//             ))
//           ) : (
//             <div className="p-6 text-center text-slate-400 text-sm italic">
//               No items recorded.
//             </div>
//           )}

//         </div>
//         <div className="p-4 bg-slate-50 flex justify-between items-center">
//           <span className="font-bold text-slate-900 text-sm">
//             {order.status === 'NEW_ORDER' ? 'Estimated Total' : 'Final Total'}
//           </span>
//           <span className="font-black text-brand-primary text-xl">
//             AED {order.final_price > 0 ? order.final_price : order.estimated_price}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// };
// import { useParams } from 'react-router-dom';
// import { useQuery } from '@tanstack/react-query';
// import { ordersService } from '../api/orders.service';
// import { OrderStatusTracker } from '../components/OrderStatusTracker';
// import { OrderTracker } from '../components/OrderTracker';
// import { Package, MapPin, Receipt } from 'lucide-react';

// export const OrderDetailPage = () => {
//   const { id } = useParams();
  
//   const { data: order, isLoading } = useQuery({
//     queryKey: ['order', id],
//     queryFn: () => ordersService.getOrderDetails(id!),
//     enabled: !!id,
//     refetchInterval: 10000, // Auto-refresh every 10 seconds to catch status changes
//   });

//   if (isLoading) return <div className="p-10 text-center text-slate-500">Loading order details...</div>;

//   return (
//     <div className="max-w-2xl mx-auto space-y-6">
//       <div className="bg-white p-6 rounded-premium shadow-soft border border-slate-100">
//         <div className="flex justify-between items-start mb-4">
//           <div>
//             <h1 className="text-xl font-bold text-slate-900">Order #{order?.id}</h1>
//             <p className="text-sm text-slate-500">Placed on {new Date(order?.created_at).toLocaleDateString()}</p>
//           </div>
//           <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-xs font-bold rounded-full">
//             {order?.status}
//           </span>
//         </div>

//         <OrderTracker currentStatus={order?.status} />
//       </div>

//       <div className="grid gap-4 md:grid-cols-2">
//         {/* Delivery Info */}
//         <div className="bg-white p-5 rounded-premium shadow-soft border border-slate-100">
//           <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3">
//             <MapPin size={18} className="text-brand-primary" /> Pickup Detail
//           </h3>
//           <p className="text-sm text-slate-600">
//             Scheduled for:<br />
//             <span className="font-semibold text-slate-900">
//                 {new Date(order?.pickup_date).toLocaleString()}
//             </span>
//           </p>
//         </div>

//         {/* Payment Info */}
//         <div className="bg-white p-5 rounded-premium shadow-soft border border-slate-100">
//           <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3">
//             <Receipt size={18} className="text-brand-primary" /> Payment
//           </h3>
//           <div className="flex justify-between items-end">
//             <div>
//               <p className="text-xs text-slate-500">Total Amount</p>
//               <p className="text-xl font-bold text-brand-primary">{order?.total_price} AED</p>
//             </div>
//             <span className="text-xs font-medium text-slate-400">Cash on Delivery</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };