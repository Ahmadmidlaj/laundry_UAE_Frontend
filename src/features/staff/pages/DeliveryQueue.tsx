import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { MapPin, Banknote, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

// UI Components (Ensure these exist as created in the previous step)
import { CardSkeleton } from'@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const DeliveryQueue = () => {
  const queryClient = useQueryClient();
  const [activeDeliveryId, setActiveDeliveryId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');

  // 1. Auto-refresh every 30 seconds
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['deliveryQueue'],
    queryFn: async () => (await api.get('/operations/delivery-queue')).data,
    refetchInterval: 30000, 
  });

  const deliverMutation = useMutation({
    mutationFn: (payload: { id: number, data: any }) => 
      api.post(`/operations/${payload.id}/deliver`, payload.data),
    onSuccess: () => {
      // 2. Instantly remove from UI
      queryClient.invalidateQueries({ queryKey: ['deliveryQueue'] });
      setActiveDeliveryId(null);
      toast.success("Delivery completed successfully!");
    },
    onError: () => {
      toast.error("Failed to complete delivery. Please try again.");
    }
  });

  // 3. Robust Loading State
  if (isLoading) return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-black text-slate-900 mb-6">Delivery Queue</h1>
      {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
    </div>
  );

  // 4. Robust Error State
  if (isError) return <EmptyState title="Connection Lost" message="Could not load deliveries." />;

  // 5. Beautiful Empty State
  if (!orders || orders.length === 0) return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-black text-slate-900 mb-6">Delivery Queue</h1>
      <EmptyState title="Queue is Empty!" message="There are no orders ready for delivery right now." />
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-24">
      <header className="flex justify-between items-end mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Delivery Queue</h1>
        <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          {orders.length} Ready
        </span>
      </header>

      <div className="grid gap-4">
        {orders.map((order: any) => (
          <div key={order.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">
                  ORDER #{order.id.toString().padStart(5, '0')}
                </span>
              </div>
              <span className="text-xl font-black text-slate-900">
                AED {order.final_price || order.estimated_price}
              </span>
            </div>

            {/* Customer Details */}
            <div className="flex gap-3 mb-6 bg-slate-50 p-3 rounded-2xl">
              <MapPin size={20} className="text-brand-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-800">{order.customer?.full_name || "Customer"}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {order.customer?.building_name ? `${order.customer.building_name}, Flat ${order.customer.flat_number}` : "Address not provided"}
                </p>
                {order.customer?.mobile && (
                  <p className="text-xs font-medium text-slate-600 mt-1">📞 {order.customer.mobile}</p>
                )}
              </div>
            </div>

            {/* Interaction Area */}
            {activeDeliveryId === order.id ? (
              <div className="space-y-4 border-t border-slate-100 pt-4 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs font-bold text-slate-400 uppercase text-center tracking-wider">
                  Select Payment Method
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'}`}
                  >
                    <Banknote size={24} />
                    <span className="text-[11px] font-bold">CASH</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CARD' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'}`}
                  >
                    <CreditCard size={24} />
                    <span className="text-[11px] font-bold">CARD / ONLINE</span>
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveDeliveryId(null)}
                    className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={deliverMutation.isPending}
                    onClick={() => deliverMutation.mutate({
                      id: order.id,
                      data: { 
                        received_amount: order.final_price || order.estimated_price, 
                        payment_method: paymentMethod 
                      }
                    })}
                    className="flex-[2] py-3.5 bg-emerald-600 text-white rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 flex justify-center items-center"
                  >
                    {deliverMutation.isPending ? "Processing..." : "Confirm & Complete"}
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setActiveDeliveryId(order.id)}
                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold active:scale-95 transition-all shadow-md"
              >
                Start Delivery
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
// import { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import api from '@/api/axios';
// import { Button } from '@/components/ui/Button';
// import { Truck, MapPin, CheckCircle2, Banknote, CreditCard } from 'lucide-react';
// import { toast } from 'sonner';

// export const DeliveryQueue = () => {
//   const queryClient = useQueryClient();
//   const [activeDelivery, setActiveDelivery] = useState<any | null>(null);
//   const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');

//   const { data: orders, isLoading } = useQuery({
//     queryKey: ['deliveryQueue'],
//     queryFn: async () => (await api.get('/operations/delivery-queue')).data
//   });

//   const deliverMutation = useMutation({
//     mutationFn: (payload: any) => api.post(`/operations/${payload.id}/deliver`, payload.data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['deliveryQueue'] });
//       setActiveDelivery(null);
//       toast.success("Delivery completed!");
//     }
//   });

//   if (isLoading) return <div className="p-8 text-center">Loading delivery list...</div>;

//   return (
//     <div className="max-w-md mx-auto p-4 space-y-6">
//       <h1 className="text-2xl font-bold">Delivery Queue</h1>
//       <div className="grid gap-4">
//         {orders?.map((order: any) => (
//           <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
//             <div className="flex justify-between mb-4">
//               <span className="text-xs font-bold text-emerald-600">ORDER #{order.id}</span>
//               <span className="font-black text-slate-900">AED {order.estimated_price}</span>
//             </div>

//             <div className="flex gap-3 mb-6">
//               <MapPin size={18} className="text-slate-400" />
//               <div>
//                 <p className="text-sm font-bold text-slate-800">{order.customer?.full_name}</p>
//                 <p className="text-xs text-slate-500">{order.customer?.building_name}, Flat {order.customer?.flat_number}</p>
//               </div>
//             </div>

//             {activeDelivery?.id === order.id ? (
//               <div className="space-y-4 bg-slate-50 p-4 rounded-xl">
//                 <p className="text-xs font-bold text-slate-400 uppercase">Select Payment</p>
//                 <div className="grid grid-cols-2 gap-2">
//                   <button 
//                     onClick={() => setPaymentMethod('CASH')}
//                     className={`p-3 rounded-lg border flex flex-col items-center gap-1 ${paymentMethod === 'CASH' ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'bg-white text-slate-400'}`}
//                   >
//                     <Banknote size={20} /><span className="text-[10px] font-bold">CASH</span>
//                   </button>
//                   <button 
//                     onClick={() => setPaymentMethod('CARD')}
//                     className={`p-3 rounded-lg border flex flex-col items-center gap-1 ${paymentMethod === 'CARD' ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'bg-white text-slate-400'}`}
//                   >
//                     <CreditCard size={20} /><span className="text-[10px] font-bold">CARD</span>
//                   </button>
//                 </div>
//                 <Button 
//                   className="w-full bg-emerald-600"
//                   isLoading={deliverMutation.isPending}
//                   onClick={() => deliverMutation.mutate({
//                     id: order.id,
//                     data: { received_amount: order.estimated_price, payment_method: paymentMethod }
//                   })}
//                 >
//                   Confirm & Close
//                 </Button>
//               </div>
//             ) : (
//               <Button 
//                 className="w-full bg-slate-900" 
//                 onClick={() => setActiveDelivery(order)}
//               >
//                 Start Delivery
//               </Button>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };
