import { useQuery } from '@tanstack/react-query';
import { adminService } from '../api/admin.service';
import { Wallet, Users, ShoppingBag, Truck, PackageCheck, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';
export const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: adminService.getDashboardStats,
    refetchInterval: 30000, // Refresh every 30s
  });

  const cards = [
    { label: 'Net Revenue', val: `AED ${stats?.total_revenue.toFixed(2)}`, icon: Wallet, color: 'emerald' },
    { label: 'Customers', val: stats?.total_customers, icon: Users, color: 'blue' },
    { label: 'New Orders', val: stats?.new_orders, icon: ShoppingBag, color: 'amber' },
    { label: 'In Transit', val: stats?.picked_up_orders, icon: Truck, color: 'indigo' },
    { label: 'Completed', val: stats?.delivered_orders, icon: PackageCheck, color: 'brand' },
    { label: 'Active Promos', val: stats?.active_offers, icon: Zap, color: 'purple' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Overview</h1>
        <p className="text-slate-500 font-medium italic">How's business looking today?</p>
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
      
      {/* Visual placeholder for future roadmap: Next we'd add "Live Orders Table" here */}
    </div>
  );
};