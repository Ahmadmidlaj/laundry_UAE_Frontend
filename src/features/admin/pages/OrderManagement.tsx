// src/features/admin/pages/OrderManagement.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../api/admin.service';
import { formatOrderId, formatSafeDate, formatTimeTo12h } from '@/utils/formatters';
import { Search, Loader2, Edit3, Package } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const OrderManagement = () => {
  const [search, setSearch] = useState('');
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['adminAllOrders'],
    queryFn: adminService.getAllOrders,
  });

  const filteredOrders = orders?.filter((o: any) => 
    o.customer?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toString().includes(search)
  );

  if (isLoading) return <OrderManagementSkeleton />;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Order Vault</h1>
          <p className="text-slate-500 font-medium">Manage all customer transactions.</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search Orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-brand-primary outline-none"
          />
        </div>
      </header>

      {filteredOrders?.length === 0 ? (
        <div className="bg-white rounded-[3rem] py-20 text-center border-2 border-dashed border-slate-100">
           <Package className="mx-auto text-slate-200 mb-4" size={48} />
           <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No Orders Found</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="p-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders?.map((order: any) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 font-black text-slate-400">{formatOrderId(order.id)}</td>
                  <td className="p-6">
                    <p className="font-bold text-slate-900">{order.customer?.full_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{order.customer?.mobile}</p>
                  </td>
                  <td className="p-6"><StatusBadge status={order.status} /></td>
                  <td className="p-6 font-black text-slate-900">AED {order.estimated_price.toFixed(2)}</td>
                  <td className="p-6 text-right">
                    <button className="p-2 hover:bg-slate-900 hover:text-white rounded-xl transition-all">
                      <Edit3 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

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
// // src/features/admin/pages/OrderManagement.tsx
// import { useState, useMemo } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { adminService } from '../api/admin.service';
// import { formatSafeDate, formatTimeTo12h, formatOrderId } from '@/utils/formatters';
// import { Search, Edit3, X, Loader2, PlusCircle, Filter } from 'lucide-react';
// import { cn } from '@/utils/cn';
// import { toast } from 'sonner';

// export const OrderManagement = () => {
//   const [search, setSearch] = useState('');
//   const [filterMonth, setFilterMonth] = useState('all');
//   const [sortBy, setSortBy] = useState('latest');
//   const [editingOrder, setEditingOrder] = useState<any>(null);
  
//   const queryClient = useQueryClient();

//   // 1. Data Fetching
//   const { data: orders, isLoading } = useQuery({
//     queryKey: ['adminAllOrders'],
//     queryFn: adminService.getAllOrders,
//   });

//   const { data: masterItems } = useQuery({
//     queryKey: ['serviceItems'],
//     queryFn: adminService.getItems,
//     enabled: !!editingOrder, // Only fetch when modal is open
//   });

//   const updateMutation = useMutation({
//     mutationFn: ({ id, data }: { id: number, data: any }) => adminService.adminUpdateOrder(id, data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['adminAllOrders'] });
//       toast.success("Order history updated");
//       setEditingOrder(null);
//     },
//   });

//   // 2. Logic: Advanced Filtering & Sorting
//   const processedOrders = useMemo(() => {
//     if (!orders) return [];
    
//     let result = orders.filter(o => 
//       o.customer?.full_name.toLowerCase().includes(search.toLowerCase()) ||
//       o.id.toString().includes(search)
//     );

//     if (filterMonth !== 'all') {
//       result = result.filter(o => new Date(o.pickup_date).getMonth() === parseInt(filterMonth));
//     }

//     return result.sort((a, b) => {
//       if (sortBy === 'latest') return b.id - a.id;
//       if (sortBy === 'oldest') return a.id - b.id;
//       if (sortBy === 'price') return b.estimated_price - a.estimated_price;
//       return 0;
//     });
//   }, [orders, search, filterMonth, sortBy]);

//   return (
//     <div className="space-y-8 pb-20 relative">
//       <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
//         <div className="space-y-1">
//           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Order Vault</h1>
//           <p className="text-slate-500 font-medium">Enterprise-level management for all transactions.</p>
//         </div>
        
//         <div className="flex flex-wrap items-center gap-3">
//           {/* Search */}
//           <div className="relative group min-w-[240px]">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary" size={18} />
//             <input 
//               type="text" placeholder="ID or Customer..." value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-sm shadow-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
//             />
//           </div>

//           {/* Month Filter */}
//           <div className="relative group">
//             <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//             <select 
//               value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
//               className="pl-11 pr-8 py-3 bg-white border border-slate-100 rounded-xl font-bold text-sm shadow-sm outline-none appearance-none"
//             >
//               <option value="all">All Time</option>
//               {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
//                 <option key={m} value={i}>{m}</option>
//               ))}
//             </select>
//           </div>

//           {/* Sort */}
//           <select 
//             value={sortBy} onChange={(e) => setSortBy(e.target.value)}
//             className="px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-sm shadow-sm outline-none"
//           >
//             <option value="latest">Latest First</option>
//             <option value="oldest">Oldest First</option>
//             <option value="price">Highest Price</option>
//           </select>
//         </div>
//       </header>

//       {/* Main Data Table (Simplified for brevity) */}
//       {/* ... (Use the desktop table and mobile card code provided previously) ... */}

//       {/* GOD MODE EDIT MODAL */}
//       {editingOrder && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
//           <div className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 shadow-2xl space-y-6">
//             <div className="flex justify-between items-center">
//               <h3 className="text-xl font-black">Edit Order #{editingOrder.id}</h3>
//               <button onClick={() => setEditingOrder(null)}><X size={20} className="text-slate-400" /></button>
//             </div>

//             <div className="space-y-6">
//               {/* Item Override Section */}
//               <div className="space-y-3">
//                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Contents</p>
//                 <div className="space-y-2">
//                   {editingOrder.items.map((i: any, index: number) => (
//                     <div key={i.item_id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
//                       <span className="text-xs font-black text-slate-700">{i.item?.name || 'Item'}</span>
//                       <input 
//                         type="number" min="0" 
//                         value={i.final_quantity ?? i.estimated_quantity}
//                         onChange={(e) => {
//                           const newItems = [...editingOrder.items];
//                           newItems[index] = { ...newItems[index], final_quantity: parseInt(e.target.value) || 0 };
//                           setEditingOrder({ ...editingOrder, items: newItems });
//                         }}
//                         className="w-16 p-2 bg-white rounded-lg text-center font-black text-sm outline-none border border-slate-200"
//                       />
//                     </div>
//                   ))}
//                 </div>

//                 {/* ADD NEW ITEM PICKER */}
//                 <div className="pt-2">
//                   <select 
//                     className="w-full p-3 rounded-xl border-2 border-dashed border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none hover:border-brand-primary/40 transition-colors"
//                     onChange={(e) => {
//                       const selectedId = parseInt(e.target.value);
//                       if (!selectedId) return;
//                       const master = masterItems?.find((mi: any) => mi.id === selectedId);
//                       const exists = editingOrder.items.find((oi: any) => oi.item_id === selectedId);
                      
//                       if (exists) return toast.error("Item already in order");
                      
//                       const newItem = { item_id: selectedId, final_quantity: 1, item: master };
//                       setEditingOrder({ ...editingOrder, items: [...editingOrder.items, newItem] });
//                     }}
//                     value=""
//                   >
//                     <option value="">+ Add New Service to Order</option>
//                     {masterItems?.map((mi: any) => (
//                       <option key={mi.id} value={mi.id}>{mi.name} (AED {mi.base_price})</option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <button 
//                 onClick={() => updateMutation.mutate({ 
//                   id: editingOrder.id, 
//                   data: { 
//                     status: editingOrder.status,
//                     items: editingOrder.items.map((i: any) => ({ 
//                       item_id: i.item_id, 
//                       final_quantity: i.final_quantity ?? i.estimated_quantity 
//                     }))
//                   } 
//                 })}
//                 className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-2"
//               >
//                 {updateMutation.isPending ? <Loader2 className="animate-spin" size={18}/> : "Commit All Changes"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
// // src/features/admin/pages/OrderManagement.tsx
// import { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { adminService } from '../api/admin.service';
// import { formatSafeDate, formatTimeTo12h, formatOrderId } from '@/utils/formatters';
// import { Search, Edit3, X, Loader2 } from 'lucide-react';
// import { cn } from '@/utils/cn';
// import { toast } from 'sonner';

// export const OrderManagement = () => {
//   const [search, setSearch] = useState('');
//   const [editingOrder, setEditingOrder] = useState<any>(null);
//   const queryClient = useQueryClient();

//   const { data: orders, isLoading } = useQuery({
//     queryKey: ['adminAllOrders'],
//     queryFn: adminService.getAllOrders,
//   });

//   const updateMutation = useMutation({
//     mutationFn: ({ id, data }: { id: number, data: any }) => adminService.adminUpdateOrder(id, data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['adminAllOrders'] });
//       toast.success("Order overridden successfully");
//       setEditingOrder(null);
//     },
//     onError: (err: any) => toast.error(err.response?.data?.detail || "Update failed")
//   });

//   const filteredOrders = orders?.filter(o => 
//     o.customer?.full_name.toLowerCase().includes(search.toLowerCase()) ||
//     o.id.toString().includes(search)
//   );

//   return (
//     <div className="space-y-8 pb-20 relative">
//       <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
//         <div>
//           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Order Vault</h1>
//           <p className="text-slate-500 font-medium italic">Master control for all customer transactions.</p>
//         </div>
        
//         <div className="relative group max-w-sm w-full">
//           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={20} />
//           <input 
//             type="text"
//             placeholder="Search by ID or Customer..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
//           />
//         </div>
//       </header>

//       {isLoading ? (
//         <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-primary" size={40} /></div>
//       ) : (
//         <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full text-left">
//               <thead className="bg-slate-50/50 border-b border-slate-100">
//                 <tr>
//                   <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
//                   <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
//                   <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</th>
//                   <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
//                   <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
//                   <th className="p-6"></th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-50">
//                 {filteredOrders?.map(order => (
//                   <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
//                     <td className="p-6 font-black text-slate-400 text-sm">{formatOrderId(order.id)}</td>
//                     <td className="p-6">
//                       <p className="font-bold text-slate-900">{order.customer?.full_name}</p>
//                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{order.customer?.mobile}</p>
//                     </td>
//                     <td className="p-6">
//                       <p className="text-xs font-bold text-slate-700">{formatSafeDate(order.pickup_date, 'dd MMM')}</p>
//                       <p className="text-[10px] font-black text-brand-primary uppercase tracking-wider">{formatTimeTo12h(order.pickup_time)}</p>
//                     </td>
//                     <td className="p-6">
//                       <StatusBadge status={order.status} />
//                     </td>
//                     <td className="p-6 font-black text-slate-900">AED {order.estimated_price.toFixed(2)}</td>
//                     <td className="p-6 text-right">
//                       <button 
//                         onClick={() => setEditingOrder(order)}
//                         className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm"
//                       >
//                         <Edit3 size={16} />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       {/* ADMIN EDIT MODAL (God Mode) */}
//       {editingOrder && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//           <div className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-slate-100 space-y-6">
//             <div className="flex justify-between items-center">
//               <div>
//                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Edit Order</h3>
//                 <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{formatOrderId(editingOrder.id)}</p>
//               </div>
//               <button onClick={() => setEditingOrder(null)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
//                 <X size={20} className="text-slate-400" />
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Force Status</label>
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

//               {/* Just an example of Admin override fields - you can expand this to include expected delivery dates if needed */}
//               <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
//                  <p className="text-[10px] text-red-600 font-black uppercase tracking-widest mb-2">Item Quantities (Override)</p>
//                  {editingOrder.items.map((i: any, index: number) => (
//                    <div key={i.item_id} className="flex justify-between items-center bg-white p-2 rounded-xl mb-2">
//                      <span className="text-xs font-bold text-slate-700">{i.item?.name || 'Item'}</span>
//                      <input 
//                        type="number" 
//                        min="0"
//                        value={i.final_quantity > 0 ? i.final_quantity : i.estimated_quantity} 
//                        onChange={(e) => {
//                          const newItems = [...editingOrder.items];
//                          newItems[index] = { ...newItems[index], final_quantity: parseInt(e.target.value) || 0 };
//                          setEditingOrder({ ...editingOrder, items: newItems });
//                        }}
//                        className="w-16 p-2 bg-slate-50 rounded-lg text-center font-black text-sm outline-none"
//                      />
//                    </div>
//                  ))}
//                  <p className="text-[9px] text-red-400 font-bold mt-2">Note: Updating quantities will recalculate final pricing automatically.</p>
//               </div>

//               <button 
//                 onClick={() => updateMutation.mutate({ 
//                   id: editingOrder.id, 
//                   data: { 
//                     status: editingOrder.status,
//                     items: editingOrder.items.map((i: any) => ({ item_id: i.item_id, final_quantity: i.final_quantity || i.estimated_quantity }))
//                   } 
//                 })}
//                 disabled={updateMutation.isPending}
//                 className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2"
//               >
//                 {updateMutation.isPending ? <Loader2 className="animate-spin" size={16}/> : "Force Update"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Extracted Badge Component
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