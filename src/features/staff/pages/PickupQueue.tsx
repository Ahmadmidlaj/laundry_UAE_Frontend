import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { toast } from 'sonner';
import { Plus, Minus, Calendar, AlertCircle, PlusCircle } from 'lucide-react';
import { getPickupStatus } from '@/utils/formatters'; // Use the helper above

export const PickupQueue = () => {
  const queryClient = useQueryClient();
  const [verifyingOrderId, setVerifyingOrderId] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [showItemPicker, setShowItemPicker] = useState(false);

  // 1. Fetch Queue
  const { data: orders, isLoading } = useQuery({
    queryKey: ['pickups'],
    queryFn: async () => (await api.get('/operations/pickup-queue')).data,
    refetchInterval: 15000, 
  });

  // 2. Fetch Master Item List (For adding new items)
  const { data: masterItems } = useQuery({
    queryKey: ['laundry-items'],
    queryFn: async () => (await api.get('/items')).data, // Ensure you have this endpoint
    enabled: verifyingOrderId !== null
  });

  const pickupMutation = useMutation({
    mutationFn: (payload: any) => api.post(`/operations/${payload.id}/pickup`, { items: payload.items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] });
      setVerifyingOrderId(null);
      toast.success("Pickup confirmed!");
    }
  });

  const startVerification = (order: any) => {
    const initial: Record<number, number> = {};
    order.items.forEach((i: any) => initial[i.item_id] = i.estimated_quantity);
    setQuantities(initial);
    setVerifyingOrderId(order.id);
  };

  const addItemToOrder = (itemId: number) => {
    setQuantities(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    setShowItemPicker(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-black text-slate-900">Pickup Queue</h1>

      {orders?.map((order: any) => {
        const dateInfo = getPickupStatus(order.pickup_date);
        
        return (
          <div key={order.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${dateInfo.color}`}>
                {dateInfo.label === "Overdue" ? <AlertCircle size={12}/> : <Calendar size={12}/>}
                {dateInfo.label}
              </span>
              <p className="font-bold text-slate-400 text-xs"># {order.id}</p>
            </div>

            <div className="mb-4">
              <p className="font-bold text-slate-900">{order.customer?.full_name}</p>
              <p className="text-xs text-slate-500">{order.customer?.building_name}, {order.customer?.flat_number}</p>
            </div>

            {verifyingOrderId === order.id ? (
              <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {Object.entries(quantities).map(([id, qty]) => {
                  const itemInfo = masterItems?.find((mi: any) => mi.id === parseInt(id));
                  return (
                    <div key={id} className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-700">{itemInfo?.name || "Item"}</span>
                      <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-xl border">
                        <button onClick={() => setQuantities(p => ({...p, [parseInt(id)]: Math.max(0, p[parseInt(id)] - 1)}))}><Minus size={14}/></button>
                        <span className="w-4 text-center font-bold text-xs">{qty}</span>
                        <button onClick={() => setQuantities(p => ({...p, [parseInt(id)]: p[parseInt(id)] + 1}))}><Plus size={14}/></button>
                      </div>
                    </div>
                  );
                })}

                {/* ADD NEW ITEM BUTTON */}
                {showItemPicker ? (
                  <select 
                    className="w-full p-2 rounded-lg border text-sm"
                    onChange={(e) => addItemToOrder(parseInt(e.target.value))}
                    defaultValue=""
                  >
                    <option value="" disabled>Select item to add...</option>
                    {masterItems?.map((mi: any) => <option key={mi.id} value={mi.id}>{mi.name}</option>)}
                  </select>
                ) : (
                  <button 
                    onClick={() => setShowItemPicker(true)}
                    className="flex items-center gap-2 text-brand-primary font-bold text-xs py-2"
                  >
                    <PlusCircle size={14} /> Add item customer forgot to list
                  </button>
                )}

                <button 
                  onClick={() => pickupMutation.mutate({ 
                    id: order.id, 
                    items: Object.entries(quantities).map(([k, v]) => ({ item_id: parseInt(k), final_quantity: v }))
                  })}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold"
                >
                  Confirm Items
                </button>
              </div>
            ) : (
              <button onClick={() => startVerification(order)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">
                Arrived at Customer
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
// import { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import api from '@/api/axios';
// import { CardSkeleton } from '@/components/ui/Skeleton';
// import { EmptyState } from '@/components/ui/EmptyState';
// import { StatusBadge } from '@/components/ui/StatusBadge';
// import { toast } from 'sonner';
// import { Plus, Minus } from 'lucide-react';

// export const PickupQueue = () => {
//   const queryClient = useQueryClient();
//   const [verifyingOrderId, setVerifyingOrderId] = useState<number | null>(null);
  
//   // Local state to track actual quantities driver collects
//   const [quantities, setQuantities] = useState<Record<number, number>>({});

//   const { data: orders, isLoading, isError } = useQuery({
//     queryKey: ['pickups'],
//     queryFn: async () => (await api.get('/operations/pickup-queue')).data,
//     refetchInterval: 30000, 
//   });

//   const pickupMutation = useMutation({
//     mutationFn: (payload: { id: number, items: { item_id: number, final_quantity: number }[] }) => 
//       api.post(`/operations/${payload.id}/pickup`, { items: payload.items }),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['pickups'] });
//       setVerifyingOrderId(null);
//       toast.success("Pickup verified and confirmed!");
//     },
//     onError: () => toast.error("Update failed. Please try again.")
//   });

//   const startVerification = (order: any) => {
//     // Pre-fill the form with the customer's estimated quantities
//     const initialQuantities: Record<number, number> = {};
//     order.items.forEach((item: any) => {
//       initialQuantities[item.item_id] = item.estimated_quantity;
//     });
//     setQuantities(initialQuantities);
//     setVerifyingOrderId(order.id);
//   };

//   const updateQuantity = (itemId: number, delta: number) => {
//     setQuantities(prev => ({
//       ...prev,
//       [itemId]: Math.max(0, (prev[itemId] || 0) + delta) // Prevent negative clothes
//     }));
//   };

//   const submitPickup = (orderId: number) => {
//     // Convert our quantities dictionary back into the array the API expects
//     const finalItems = Object.entries(quantities).map(([item_id, qty]) => ({
//       item_id: parseInt(item_id),
//       final_quantity: qty
//     }));
    
//     pickupMutation.mutate({ id: orderId, items: finalItems });
//   };

//   if (isLoading) return <div className="p-4 space-y-4">{[1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>;
//   if (isError) return <EmptyState title="Connection Error" message="Check your internet and try again." />;
//   if (!orders || orders.length === 0) return <EmptyState title="All Caught Up!" message="No new pickups." />;

//   return (
//     <div className="max-w-md mx-auto p-4 space-y-4 pb-24">
//       <header className="flex justify-between items-end mb-6">
//         <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pickup Queue</h1>
//         <span className="text-sm font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
//           {orders.length} Orders
//         </span>
//       </header>

//       {orders.map((order: any) => (
//         <div key={order.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
//           <div className="flex justify-between items-start mb-4">
//             <div>
//               <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Order ID</p>
//               <p className="font-bold text-slate-900"># {order.id.toString().padStart(5, '0')}</p>
//             </div>
//             <StatusBadge status={order.status} />
//           </div>

//           {/* VERIFICATION UI */}
//           {verifyingOrderId === order.id ? (
//             <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
//               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
//                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Verify Actual Items</p>
//                 {order.items?.map((item: any) => (
//                   <div key={item.item_id} className="flex justify-between items-center">
//                     <span className="text-sm font-bold text-slate-700">
//                       {item.item?.name || "Unknown Item"}
//                     </span>
//                     <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-sm">
//                       <button onClick={() => updateQuantity(item.item_id, -1)} className="p-1 text-slate-400 hover:text-red-500">
//                         <Minus size={16} />
//                       </button>
//                       <span className="w-6 text-center font-bold text-slate-900">
//                         {quantities[item.item_id] || 0}
//                       </span>
//                       <button onClick={() => updateQuantity(item.item_id, 1)} className="p-1 text-slate-400 hover:text-emerald-500">
//                         <Plus size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               <div className="flex gap-2">
//                 <button 
//                   onClick={() => setVerifyingOrderId(null)}
//                   className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold active:scale-95 transition-all"
//                 >
//                   Cancel
//                 </button>
//                 <button 
//                   disabled={pickupMutation.isPending}
//                   onClick={() => submitPickup(order.id)}
//                   className="flex-[2] py-3.5 bg-slate-900 text-white rounded-xl font-bold active:scale-95 transition-all shadow-md disabled:opacity-50"
//                 >
//                   {pickupMutation.isPending ? "Saving..." : "Confirm Pickup"}
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <>
//               {/* Read-Only Summary before clicking Arrived */}
//               <div className="space-y-2 mb-6">
//                 {order.items?.map((item: any, idx: number) => (
//                   <div key={idx} className="flex justify-between text-sm">
//                     <span className="text-slate-600 font-medium">
//                       {item.item?.name || "Standard Wash"} x {item.estimated_quantity}
//                     </span>
//                     <span className="text-slate-400 italic">AED {item.unit_price}</span>
//                   </div>
//                 ))}
//               </div>

//               <button
//                 onClick={() => startVerification(order)}
//                 className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold active:scale-95 transition-all"
//               >
//                 Arrived at Customer
//               </button>
//             </>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// };
// import { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import api from '@/api/axios';
// import { CardSkeleton } from '@/components/ui/Skeleton';
// import { EmptyState } from '@/components/ui/EmptyState';
// import { StatusBadge } from '@/components/ui/StatusBadge';
// import { toast } from 'sonner';
// import { Plus, Minus } from 'lucide-react';

// export const PickupQueue = () => {
//   const queryClient = useQueryClient();
//   const [verifyingOrderId, setVerifyingOrderId] = useState<number | null>(null);
  
//   // Local state to track actual quantities driver collects
//   const [quantities, setQuantities] = useState<Record<number, number>>({});

//   const { data: orders, isLoading, isError } = useQuery({
//     queryKey: ['pickups'],
//     queryFn: async () => (await api.get('/operations/pickup-queue')).data,
//     refetchInterval: 30000, 
//   });

//   const pickupMutation = useMutation({
//     mutationFn: (payload: { id: number, items: { item_id: number, final_quantity: number }[] }) => 
//       api.post(`/operations/${payload.id}/pickup`, { items: payload.items }),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['pickups'] });
//       setVerifyingOrderId(null);
//       toast.success("Pickup verified and confirmed!");
//     },
//     onError: () => toast.error("Update failed. Please try again.")
//   });

//   const startVerification = (order: any) => {
//     // Pre-fill the form with the customer's estimated quantities
//     const initialQuantities: Record<number, number> = {};
//     order.items.forEach((item: any) => {
//       initialQuantities[item.item_id] = item.estimated_quantity;
//     });
//     setQuantities(initialQuantities);
//     setVerifyingOrderId(order.id);
//   };

//   const updateQuantity = (itemId: number, delta: number) => {
//     setQuantities(prev => ({
//       ...prev,
//       [itemId]: Math.max(0, (prev[itemId] || 0) + delta) // Prevent negative clothes
//     }));
//   };

//   const submitPickup = (orderId: number) => {
//     // Convert our quantities dictionary back into the array the API expects
//     const finalItems = Object.entries(quantities).map(([item_id, qty]) => ({
//       item_id: parseInt(item_id),
//       final_quantity: qty
//     }));
    
//     pickupMutation.mutate({ id: orderId, items: finalItems });
//   };

//   if (isLoading) return <div className="p-4 space-y-4">{[1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>;
//   if (isError) return <EmptyState title="Connection Error" message="Check your internet and try again." />;
//   if (!orders || orders.length === 0) return <EmptyState title="All Caught Up!" message="No new pickups." />;

//   return (
//     <div className="max-w-md mx-auto p-4 space-y-4 pb-24">
//       <header className="flex justify-between items-end mb-6">
//         <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pickup Queue</h1>
//         <span className="text-sm font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
//           {orders.length} Orders
//         </span>
//       </header>

//       {orders.map((order: any) => (
//         <div key={order.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
//           <div className="flex justify-between items-start mb-4">
//             <div>
//               <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Order ID</p>
//               <p className="font-bold text-slate-900"># {order.id.toString().padStart(5, '0')}</p>
//             </div>
//             <StatusBadge status={order.status} />
//           </div>

//           {/* VERIFICATION UI */}
//           {verifyingOrderId === order.id ? (
//             <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
//               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
//                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Verify Actual Items</p>
//                 {order.items?.map((item: any) => (
//                   <div key={item.item_id} className="flex justify-between items-center">
//                     <span className="text-sm font-bold text-slate-700">
//                       {item.item?.name || "Unknown Item"}
//                     </span>
//                     <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-sm">
//                       <button onClick={() => updateQuantity(item.item_id, -1)} className="p-1 text-slate-400 hover:text-red-500">
//                         <Minus size={16} />
//                       </button>
//                       <span className="w-6 text-center font-bold text-slate-900">
//                         {quantities[item.item_id] || 0}
//                       </span>
//                       <button onClick={() => updateQuantity(item.item_id, 1)} className="p-1 text-slate-400 hover:text-emerald-500">
//                         <Plus size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               <div className="flex gap-2">
//                 <button 
//                   onClick={() => setVerifyingOrderId(null)}
//                   className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold active:scale-95 transition-all"
//                 >
//                   Cancel
//                 </button>
//                 <button 
//                   disabled={pickupMutation.isPending}
//                   onClick={() => submitPickup(order.id)}
//                   className="flex-[2] py-3.5 bg-slate-900 text-white rounded-xl font-bold active:scale-95 transition-all shadow-md disabled:opacity-50"
//                 >
//                   {pickupMutation.isPending ? "Saving..." : "Confirm Pickup"}
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <>
//               {/* Read-Only Summary before clicking Arrived */}
//               <div className="space-y-2 mb-6">
//                 {order.items?.map((item: any, idx: number) => (
//                   <div key={idx} className="flex justify-between text-sm">
//                     <span className="text-slate-600 font-medium">
//                       {item.item?.name || "Standard Wash"} x {item.estimated_quantity}
//                     </span>
//                     <span className="text-slate-400 italic">AED {item.unit_price}</span>
//                   </div>
//                 ))}
//               </div>

//               <button
//                 onClick={() => startVerification(order)}
//                 className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold active:scale-95 transition-all"
//               >
//                 Arrived at Customer
//               </button>
//             </>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// };

// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import api from '@/api/axios';
// import { CardSkeleton } from '@/components/ui/Skeleton';
// import { EmptyState } from '@/components/ui/EmptyState';
// import { StatusBadge } from '@/components/ui/StatusBadge';
// import { toast } from 'sonner';

// export const PickupQueue = () => {
//   const queryClient = useQueryClient();

//   // 1. Automatic Refetch every 30s as a fallback for WebSockets
//   const { data: orders, isLoading, isError } = useQuery({
//     queryKey: ['pickups'],
//     queryFn: async () => (await api.get('/operations/pickup-queue')).data,
//     refetchInterval: 30000, 
//   });

//   const pickupMutation = useMutation({
//     mutationFn: (id: number) => api.post(`/operations/${id}/pickup`, { items: [] }),
//     onSuccess: () => {
//       // 2. Immediate cache invalidation triggers "instantly disappear" behavior
//       queryClient.invalidateQueries({ queryKey: ['pickups'] });
//       toast.success("Order removed from queue");
//     },
//     onError: () => toast.error("Update failed. Please try again.")
//   });

//   if (isLoading) return (
//     <div className="p-4 space-y-4">
//       {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
//     </div>
//   );

//   if (isError) return <EmptyState title="Connection Error" message="Check your internet and try again." />;

//   if (!orders || orders.length === 0) return (
//     <EmptyState title="All Caught Up!" message="No new pickups are currently scheduled." />
//   );

//   return (
//     <div className="max-w-md mx-auto p-4 space-y-4">
//       <header className="flex justify-between items-end mb-6">
//         <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pickup Queue</h1>
//         <span className="text-sm font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
//           {orders.length} Orders
//         </span>
//       </header>

//       {orders.map((order: any) => (
//         <div key={order.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
//           <div className="flex justify-between items-start mb-4">
//             <div>
//               <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Order ID</p>
//               <p className="font-bold text-slate-900"># {order.id.toString().padStart(5, '0')}</p>
//             </div>
//             <StatusBadge status={order.status} />
//           </div>

//           <div className="space-y-2 mb-6">
//             {/* FIX 5: Human Readable Names instead of Item ID */}
//             {order.items?.map((item: any, idx: number) => (
//               <div key={idx} className="flex justify-between text-sm">
//                 <span className="text-slate-600 font-medium">
//                   {item.laundry_item?.name || "Standard Wash"} x {item.estimated_quantity}
//                 </span>
//                 <span className="text-slate-400 italic">AED {item.unit_price}</span>
//               </div>
//             ))}
//           </div>

//           <button
//             onClick={() => pickupMutation.mutate(order.id)}
//             disabled={pickupMutation.isPending}
//             className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold active:scale-95 transition-all disabled:opacity-50"
//           >
//             {pickupMutation.isPending ? "Updating Queue..." : "Arrived at Customer"}
//           </button>
//         </div>
//       ))}
//     </div>
//   );
// };

