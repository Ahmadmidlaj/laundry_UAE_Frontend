// src/features/admin/pages/OrderManagement.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../api/admin.service';
import { formatOrderId, formatSafeDate, formatTimeTo12h } from '@/utils/formatters';
import { Search, Loader2, Edit3, Package, X, PlusCircle, MinusCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

export const OrderManagement = () => {
  const [search, setSearch] = useState('');
  const [editingOrder, setEditingOrder] = useState<any>(null); 
  const queryClient = useQueryClient();

  // 1. Fetch Orders safely
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['adminAllOrders'],
    queryFn: adminService.getAllOrders,
  });

  // 2. Fetch Master Items (Only fires when the modal opens to save bandwidth)
  const { data: masterItems = [] } = useQuery({
    queryKey: ['serviceItems'],
    queryFn: adminService.getItems,
    enabled: !!editingOrder, 
  });

  // 3. Update Mutation (Triggers backend recalculation)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => adminService.adminUpdateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllOrders'] });
      toast.success("Order updated and financials recalculated!");
      setEditingOrder(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to update order. Check connection.");
    }
  });

  // Safe filtering logic
  const filteredOrders = orders.filter((o: any) => {
    const searchLower = search.toLowerCase();
    const customerName = o.customer?.full_name?.toLowerCase() || '';
    const orderIdStr = o.id?.toString() || '';
    return customerName.includes(searchLower) || orderIdStr.includes(searchLower);
  });

  if (isLoading) return <OrderManagementSkeleton />;

  return (
    <div className="space-y-8 pb-20 relative">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Order Vault</h1>
          <p className="text-slate-500 font-medium">Manage all customer transactions.</p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search by ID or Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
          />
        </div>
      </header>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-[3rem] py-24 text-center border-2 border-dashed border-slate-100 shadow-sm">
           <Package className="mx-auto text-slate-200 mb-4" size={56} />
           <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No Orders Found</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Amount</th>
                  <th className="p-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6 font-black text-slate-400">{formatOrderId(order.id)}</td>
                    <td className="p-6">
                      <p className="font-bold text-slate-900">{order.customer?.full_name || 'Unknown User'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{order.customer?.mobile || 'No Phone'}</p>
                    </td>
                    <td className="p-6"><StatusBadge status={order.status} /></td>
                    <td className="p-6 font-black text-slate-900">AED {order.estimated_price?.toFixed(2) || '0.00'}</td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={() => {
                          // DEEP COPY: Ensures editing doesn't mutate the cached React Query data directly
                          const orderCopy = JSON.parse(JSON.stringify(order));
                          // Fallback to empty array if items is undefined
                          orderCopy.items = orderCopy.items || [];
                          setEditingOrder(orderCopy);
                        }}
                        className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm group-hover:bg-brand-primary group-hover:text-white"
                      >
                        <Edit3 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GOD MODE EDIT MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl space-y-0">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 border-b border-slate-100 flex justify-between items-center z-10">
              <div>
                <h3 className="text-xl font-black text-slate-900">Modify Order</h3>
                <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{formatOrderId(editingOrder.id)}</p>
              </div>
              <button onClick={() => setEditingOrder(null)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* STATUS OVERRIDE */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Force Status</label>
                <select 
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border border-slate-100 mt-1 focus:ring-2 focus:ring-brand-primary transition-all"
                  value={editingOrder.status}
                  onChange={(e) => setEditingOrder({...editingOrder, status: e.target.value})}
                >
                  <option value="NEW_ORDER">New Order (Pending)</option>
                  <option value="PICKED_UP">Picked Up (In Facility)</option>
                  <option value="DELIVERED">Delivered (Completed)</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* ITEM OVERRIDE SECTION */}
              <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Contents</p>
                  <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md">
                    <AlertCircle size={12}/> Affects Pricing
                  </span>
                </div>
                
                {/* List Existing Items */}
                <div className="space-y-2">
                  {editingOrder.items.length === 0 ? (
                    <p className="text-xs font-bold text-slate-400 text-center py-4">No items currently in order.</p>
                  ) : (
                    editingOrder.items.map((i: any, index: number) => {
                      // THE FIX: Use || to catch 0 and default to estimated. If both are 0, fallback to 1.
                      const displayQty = i.final_quantity || i.estimated_quantity || 0;

                      return (
                        <div key={index} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-brand-primary/20">
                          <span className="text-xs font-bold text-slate-700">{i.item?.name || 'Unknown Service'}</span>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              min="0"
                              value={displayQty === 0 ? '' : displayQty} // Better UX: don't show raw '0'
                              placeholder="0"
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                const newItems = [...editingOrder.items];
                                // Force sync both fields so UI doesn't glitch and backend gets correct data
                                newItems[index] = { ...newItems[index], final_quantity: val, estimated_quantity: val };
                                setEditingOrder({ ...editingOrder, items: newItems });
                              }}
                              className="w-16 p-2 bg-slate-50 rounded-lg text-center font-black text-sm outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                            />
                            <button 
                              onClick={() => {
                                const newItems = editingOrder.items.filter((_: any, idx: number) => idx !== index);
                                setEditingOrder({ ...editingOrder, items: newItems });
                              }}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                            >
                              <MinusCircle size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Dropdown to add missing items */}
                <div className="pt-2">
                  <select 
                    className="w-full p-4 rounded-xl border-2 border-dashed border-slate-200 bg-white text-xs font-bold text-slate-500 outline-none hover:border-brand-primary/40 focus:border-brand-primary transition-colors cursor-pointer appearance-none"
                    onChange={(e) => {
                      const selectedId = parseInt(e.target.value);
                      if (!selectedId) return;
                      const master = masterItems.find((mi: any) => mi.id === selectedId);
                      
                      // Check if already in order
                      if (editingOrder.items.some((oi: any) => oi.item_id === selectedId)) {
                        toast.error(`${master?.name} is already in the order. Please increase its quantity above.`);
                        return; // Exit early
                      }
                      
                      // Add new item with qty 1
                      const newItem = { item_id: selectedId, final_quantity: 1, estimated_quantity: 1, item: master };
                      setEditingOrder({ ...editingOrder, items: [...editingOrder.items, newItem] });
                    }}
                    value="" // Always reset to empty so onChange fires again
                  >
                    <option value="" disabled>+ Select a service to add...</option>
                    {masterItems.map((mi: any) => (
                      <option key={mi.id} value={mi.id}>{mi.name} (AED {mi.base_price})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SUBMIT */}
              <div className="pt-4">
                <button 
                  onClick={() => {
                    // Final verification of payload
                    const payloadItems = editingOrder.items
                      .map((i: any) => ({ 
                        item_id: i.item_id, 
                        final_quantity: i.final_quantity || i.estimated_quantity || 0 
                      }))
                      .filter((i: any) => i.final_quantity > 0); // Don't send items with 0 qty

                    updateMutation.mutate({ 
                      id: editingOrder.id, 
                      data: { 
                        status: editingOrder.status,
                        items: payloadItems
                      } 
                    });
                  }}
                  disabled={updateMutation.isPending}
                  className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70"
                >
                  {updateMutation.isPending ? <Loader2 className="animate-spin" size={18}/> : "Save & Recalculate Price"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components
const OrderManagementSkeleton = () => (
  <div className="space-y-8 animate-pulse p-4">
    <div className="h-12 w-48 bg-slate-100 rounded-xl" />
    <div className="space-y-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 bg-white border border-slate-100 rounded-[2rem]" />
      ))}
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    NEW_ORDER: "bg-amber-50 text-amber-600 border-amber-100",
    PICKED_UP: "bg-blue-50 text-blue-600 border-blue-100",
    DELIVERED: "bg-emerald-50 text-emerald-600 border-emerald-100",
    CANCELLED: "bg-red-50 text-red-600 border-red-100",
  };
  return (
    <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border", styles[status])}>
      {status?.replace('_', ' ') || 'UNKNOWN'}
    </span>
  );
};
// // src/features/admin/pages/OrderManagement.tsx
// import { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { adminService } from '../api/admin.service';
// import { formatOrderId, formatSafeDate, formatTimeTo12h } from '@/utils/formatters';
// import { Search, Loader2, Edit3, Package, X } from 'lucide-react';
// import { toast } from 'sonner';
// import { cn } from '@/utils/cn';

// export const OrderManagement = () => {
//   const [search, setSearch] = useState('');
//   // MISSING STATE ADDED HERE
//   const [editingOrder, setEditingOrder] = useState<any>(null); 
//   const queryClient = useQueryClient();

//   const { data: orders, isLoading } = useQuery({
//     queryKey: ['adminAllOrders'],
//     queryFn: adminService.getAllOrders,
//   });

//   // MISSING MUTATION ADDED HERE
//   const updateMutation = useMutation({
//     mutationFn: ({ id, data }: { id: number, data: any }) => adminService.adminUpdateOrder(id, data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['adminAllOrders'] });
//       toast.success("Order updated successfully");
//       setEditingOrder(null);
//     },
//     onError: (err: any) => toast.error(err.response?.data?.detail || "Update failed")
//   });

//   const filteredOrders = orders?.filter((o: any) => 
//     o.customer?.full_name.toLowerCase().includes(search.toLowerCase()) ||
//     o.id.toString().includes(search)
//   );

//   if (isLoading) return <OrderManagementSkeleton />;

//   return (
//     <div className="space-y-8 pb-20 relative">
//       <header className="flex justify-between items-end">
//         <div>
//           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Order Vault</h1>
//           <p className="text-slate-500 font-medium">Manage all customer transactions.</p>
//         </div>
//         <div className="relative w-72">
//           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//           <input 
//             type="text"
//             placeholder="Search Orders..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-brand-primary outline-none"
//           />
//         </div>
//       </header>

//       {filteredOrders?.length === 0 ? (
//         <div className="bg-white rounded-[3rem] py-20 text-center border-2 border-dashed border-slate-100">
//            <Package className="mx-auto text-slate-200 mb-4" size={48} />
//            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No Orders Found</p>
//         </div>
//       ) : (
//         <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
//           <table className="w-full text-left">
//             <thead className="bg-slate-50/50 border-b border-slate-100">
//               <tr>
//                 <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
//                 <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
//                 <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
//                 <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
//                 <th className="p-6"></th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {filteredOrders?.map((order: any) => (
//                 <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
//                   <td className="p-6 font-black text-slate-400">{formatOrderId(order.id)}</td>
//                   <td className="p-6">
//                     <p className="font-bold text-slate-900">{order.customer?.full_name}</p>
//                     <p className="text-[10px] font-bold text-slate-400 uppercase">{order.customer?.mobile}</p>
//                   </td>
//                   <td className="p-6"><StatusBadge status={order.status} /></td>
//                   <td className="p-6 font-black text-slate-900">AED {order.estimated_price?.toFixed(2) || '0.00'}</td>
//                   <td className="p-6 text-right">
//                     {/* MISSING ONCLICK HANDLER ADDED HERE */}
//                     <button 
//                       onClick={() => setEditingOrder(order)}
//                       className="p-2 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
//                     >
//                       <Edit3 size={18} />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* MISSING EDIT MODAL ADDED HERE */}
//       {editingOrder && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//           <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl border border-slate-100 space-y-6">
//             <div className="flex justify-between items-center">
//               <h3 className="text-xl font-black text-slate-900">Edit Status</h3>
//               <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-slate-600">
//                 <X size={20} />
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Force Order Status</label>
//                 <select 
//                   className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border border-slate-100 mt-1"
//                   value={editingOrder.status}
//                   onChange={(e) => setEditingOrder({...editingOrder, status: e.target.value})}
//                 >
//                   <option value="NEW_ORDER">New Order</option>
//                   <option value="PICKED_UP">Picked Up</option>
//                   <option value="DELIVERED">Delivered</option>
//                   <option value="CANCELLED">Cancelled</option>
//                 </select>
//               </div>

//               <button 
//                 onClick={() => updateMutation.mutate({ id: editingOrder.id, data: { status: editingOrder.status } })}
//                 disabled={updateMutation.isPending}
//                 className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2"
//               >
//                 {updateMutation.isPending ? <Loader2 className="animate-spin" size={16}/> : "Update Order"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const OrderManagementSkeleton = () => (
//   <div className="space-y-8 animate-pulse p-4">
//     <div className="h-12 w-48 bg-slate-100 rounded-xl" />
//     <div className="space-y-4">
//       {[1, 2, 3, 4].map(i => (
//         <div key={i} className="h-24 bg-white border border-slate-100 rounded-[2rem]" />
//       ))}
//     </div>
//   </div>
// );

// const StatusBadge = ({ status }: { status: string }) => {
//   const styles: any = {
//     NEW_ORDER: "bg-amber-50 text-amber-600 border-amber-100",
//     PICKED_UP: "bg-blue-50 text-blue-600 border-blue-100",
//     DELIVERED: "bg-emerald-50 text-emerald-600 border-emerald-100",
//     CANCELLED: "bg-red-50 text-red-600 border-red-100",
//   };
//   return (
//     <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border", styles[status])}>
//       {status?.replace('_', ' ')}
//     </span>
//   );
// };

// // src/features/admin/pages/OrderManagement.tsx
// import { useState } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { adminService } from '../api/admin.service';
// import { formatOrderId, formatSafeDate, formatTimeTo12h } from '@/utils/formatters';
// import { Search, Loader2, Edit3, Package } from 'lucide-react';
// import { StatusBadge } from '@/components/ui/StatusBadge';

// export const OrderManagement = () => {
//   const [search, setSearch] = useState('');
//   const { data: orders, isLoading, isError } = useQuery({
//     queryKey: ['adminAllOrders'],
//     queryFn: adminService.getAllOrders,
//   });

//   const filteredOrders = orders?.filter((o: any) => 
//     o.customer?.full_name.toLowerCase().includes(search.toLowerCase()) ||
//     o.id.toString().includes(search)
//   );

//   if (isLoading) return <OrderManagementSkeleton />;

//   return (
//     <div className="space-y-8 pb-20">
//       <header className="flex justify-between items-end">
//         <div>
//           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Order Vault</h1>
//           <p className="text-slate-500 font-medium">Manage all customer transactions.</p>
//         </div>
//         <div className="relative w-72">
//           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//           <input 
//             type="text"
//             placeholder="Search Orders..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-brand-primary outline-none"
//           />
//         </div>
//       </header>

//       {filteredOrders?.length === 0 ? (
//         <div className="bg-white rounded-[3rem] py-20 text-center border-2 border-dashed border-slate-100">
//            <Package className="mx-auto text-slate-200 mb-4" size={48} />
//            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No Orders Found</p>
//         </div>
//       ) : (
//         <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
//           <table className="w-full text-left">
//             <thead className="bg-slate-50/50 border-b border-slate-100">
//               <tr>
//                 <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
//                 <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
//                 <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
//                 <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
//                 <th className="p-6"></th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {filteredOrders?.map((order: any) => (
//                 <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
//                   <td className="p-6 font-black text-slate-400">{formatOrderId(order.id)}</td>
//                   <td className="p-6">
//                     <p className="font-bold text-slate-900">{order.customer?.full_name}</p>
//                     <p className="text-[10px] font-bold text-slate-400 uppercase">{order.customer?.mobile}</p>
//                   </td>
//                   <td className="p-6"><StatusBadge status={order.status} /></td>
//                   <td className="p-6 font-black text-slate-900">AED {order.estimated_price.toFixed(2)}</td>
//                   <td className="p-6 text-right">
//                     <button className="p-2 hover:bg-slate-900 hover:text-white rounded-xl transition-all">
//                       <Edit3 size={18} />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// };

// const OrderManagementSkeleton = () => (
//   <div className="space-y-8 animate-pulse p-4">
//     <div className="h-12 w-48 bg-slate-100 rounded-xl" />
//     <div className="space-y-4">
//       {[1, 2, 3, 4].map(i => (
//         <div key={i} className="h-24 bg-white border border-slate-100 rounded-[2rem]" />
//       ))}
//     </div>
//   </div>
// );

