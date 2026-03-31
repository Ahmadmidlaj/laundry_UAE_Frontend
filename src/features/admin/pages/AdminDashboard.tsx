// src/features/admin/pages/AdminDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../api/admin.service';
import { Wallet, Users, ShoppingBag, Truck, PackageCheck, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: adminService.getDashboardStats,
    refetchInterval: 30000, // Refresh every 30s
  });

  const cards = [
    { label: 'Net Revenue', val: `AED ${stats?.total_revenue?.toFixed(2) || '0.00'}`, icon: Wallet, color: 'emerald' },
    { label: 'Customers', val: stats?.total_customers || 0, icon: Users, color: 'blue' },
    { label: 'New Orders', val: stats?.new_orders || 0, icon: ShoppingBag, color: 'amber' },
    { label: 'In Transit', val: stats?.picked_up_orders || 0, icon: Truck, color: 'indigo' },
    { label: 'Completed', val: stats?.delivered_orders || 0, icon: PackageCheck, color: 'brand' },
    { label: 'Active Promos', val: stats?.active_offers || 0, icon: Zap, color: 'purple' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Overview</h1>
          <p className="text-slate-500 font-medium italic">How's business looking today?</p>
        </div>
        <Link 
          to="/admin/reports" 
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-primary transition-all shadow-xl shadow-slate-200 text-center"
        >
          View Deep Analytics
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-start transition-all hover:shadow-xl hover:shadow-slate-100 group">
             <div className={cn(
               "h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500",
               `bg-${card.color}-50 text-${card.color}-500`
             )}>
                <card.icon size={28} />
             </div>
             <div>
                <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">
                  {isLoading ? '...' : card.val}
                </p>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{card.label}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
// import { useQuery } from '@tanstack/react-query';
// import { adminService } from '../api/admin.service';
// import { Wallet, Users, ShoppingBag, Truck, PackageCheck, Zap } from 'lucide-react';
// import { cn } from '@/utils/cn';
// export const AdminDashboard = () => {
//   const { data: stats, isLoading } = useQuery({
//     queryKey: ['adminDashboard'],
//     queryFn: adminService.getDashboardStats,
//     refetchInterval: 30000, // Refresh every 30s
//   });

//   const cards = [
//     { label: 'Net Revenue', val: `AED ${stats?.total_revenue.toFixed(2)}`, icon: Wallet, color: 'emerald' },
//     { label: 'Customers', val: stats?.total_customers, icon: Users, color: 'blue' },
//     { label: 'New Orders', val: stats?.new_orders, icon: ShoppingBag, color: 'amber' },
//     { label: 'In Transit', val: stats?.picked_up_orders, icon: Truck, color: 'indigo' },
//     { label: 'Completed', val: stats?.delivered_orders, icon: PackageCheck, color: 'brand' },
//     { label: 'Active Promos', val: stats?.active_offers, icon: Zap, color: 'purple' },
//   ];

//   return (
//     <div className="space-y-8">
//       <header>
//         <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Overview</h1>
//         <p className="text-slate-500 font-medium italic">How's business looking today?</p>
//       </header>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {cards.map((card, i) => (
//           <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-start transition-all hover:shadow-xl hover:shadow-slate-100 group">
//              <div className={cn(
//                "h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500",
//                `bg-${card.color}-50 text-${card.color}-500`
//              )}>
//                 <card.icon size={28} />
//              </div>
//              <div>
//                 <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">
//                   {isLoading ? '...' : card.val}
//                 </p>
//                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{card.label}</p>
//              </div>
//           </div>
//         ))}
//       </div>
      
//       {/* Visual placeholder for future roadmap: Next we'd add "Live Orders Table" here */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* Revenue Performance */}
//         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
//           <div className="flex justify-between items-center mb-8">
//             <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Trend</h3>
//             <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase">Live Update</span>
//           </div>
          
//           <div className="h-64 flex items-end gap-3 px-2">
//             {[45, 60, 55, 80, 70, 95].map((h, i) => (
//               <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
//                 <div 
//                   className="w-full bg-slate-50 rounded-2xl group-hover:bg-brand-primary transition-all duration-500 relative" 
//                   style={{ height: `${h}%` }}
//                 >
//                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
//                     {h}%
//                   </div>
//                 </div>
//                 <span className="text-[10px] font-black text-slate-400 uppercase">M{i+1}</span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Popular Services */}
//         <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white">
//           <h3 className="text-xl font-black mb-8 tracking-tight">Top Services</h3>
//           <div className="space-y-6">
//             {[
//               { name: 'Wash & Fold', qty: 124, color: 'brand' },
//               { name: 'Dry Cleaning', qty: 89, color: 'purple' },
//               { name: 'Ironing Only', qty: 45, color: 'blue' },
//             ].map((item, i) => (
//               <div key={i} className="space-y-2">
//                 <div className="flex justify-between text-xs font-black uppercase tracking-widest">
//                   <span className="opacity-60">{item.name}</span>
//                   <span>{item.qty} Orders</span>
//                 </div>
//                 <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
//                   <div 
//                     className="h-full bg-brand-primary animate-in slide-in-from-left duration-1000" 
//                     style={{ width: `${(item.qty/150)*100}%` }} 
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };