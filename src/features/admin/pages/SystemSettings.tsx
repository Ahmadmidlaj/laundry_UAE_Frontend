import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { adminService } from '../api/admin.service';
import { toast } from 'sonner';
import { Settings, Save, Loader2, Coins, Users, ToggleRight } from 'lucide-react';

export const SystemSettings = () => {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['systemConfig'],
    queryFn: adminService.getSystemConfig,
  });

  const { register, handleSubmit, watch } = useForm({
    values: {
      referral_system_enabled: config?.referral_system_enabled ?? false,
      reward_credits_per_referral: config?.reward_credits_per_referral ?? 50.0,
      credit_conversion_rate: config?.credit_conversion_rate ?? 1.0,
    }
  });

  const isEnabled = watch('referral_system_enabled');

  const mutation = useMutation({
    mutationFn: adminService.updateSystemConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
      toast.success("Marketing configurations updated successfully.");
    },
    onError: () => toast.error("Failed to update settings.")
  });

  if (isLoading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-primary" /></div>;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-3xl">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">System Settings</h1>
        <p className="text-slate-500 font-medium">Configure global rewards and referral logic.</p>
      </header>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
          
          {/* Master Switch */}
          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                <ToggleRight size={24} />
              </div>
              <div>
                <p className="font-black text-slate-900 uppercase text-xs tracking-widest">Referral System</p>
                <p className="text-xs text-slate-500 font-medium">{isEnabled ? 'Active & Rewarding' : 'System Disabled'}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" {...register('referral_system_enabled')} />
              <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-primary"></div>
            </label>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ${!isEnabled && 'opacity-30 pointer-events-none grayscale'}`}>
            {/* Reward Credits */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Coins size={12} /> Reward Credits
              </label>
              <div className="relative">
                <input 
                  type="number"
                  {...register('reward_credits_per_referral', { valueAsNumber: true })}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none" 
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Per User</span>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Users size={12} /> Conversion Rate
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">1 pt = </span>
                <input 
                  type="number"
                  step="0.01"
                  {...register('credit_conversion_rate', { valueAsNumber: true })}
                  className="w-full pl-16 pr-5 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none" 
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">AED</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={mutation.isPending}
          className="w-full md:w-auto px-10 bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-brand-primary transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Update System Config
        </button>
      </form>
    </div>
  );
};
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { useForm } from 'react-hook-form';
// import { adminService } from '../api/admin.service';
// import { toast } from 'sonner';
// import { Settings, Save, Loader2, Coins, Users, Power } from 'lucide-react';

// export const SystemSettings = () => {
//   const queryClient = useQueryClient();

//   const { data: config, isLoading } = useQuery({
//     queryKey: ['systemConfig'],
//     queryFn: adminService.getSystemConfig,
//   });

//   const { register, handleSubmit, watch, setValue } = useForm({
//     values: {
//       referral_system_enabled: config?.referral_system_enabled ?? false,
//       reward_credits_per_referral: config?.reward_credits_per_referral ?? 50.0,
//       credit_conversion_rate: config?.credit_conversion_rate ?? 1.0,
//     }
//   });

//   const isEnabled = watch('referral_system_enabled');

//   const mutation = useMutation({
//     mutationFn: adminService.updateSystemConfig,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
//       toast.success("System configurations updated securely.");
//     },
//     onError: () => toast.error("Failed to update configurations.")
//   });

//   if (isLoading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-primary" /></div>;

//   return (
//     <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-4xl">
//       <header>
//         <h1 className="text-4xl font-black text-slate-900 tracking-tighter">System Settings</h1>
//         <p className="text-slate-500 font-medium mt-1">Manage global application configurations and marketing logic.</p>
//       </header>

//       <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-8">
        
//         {/* REFERRAL SYSTEM MODULE */}
//         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
//           <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
//             <div className="h-12 w-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
//               <Users size={24} />
//             </div>
//             <div>
//               <h2 className="text-xl font-black text-slate-900">Referral & Rewards Engine</h2>
//               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Control customer acquisition logic</p>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             {/* MASTER TOGGLE */}
//             <div className="bg-slate-50 p-6 rounded-3xl flex items-center justify-between border border-slate-100 md:col-span-2">
//               <div>
//                 <p className="font-black text-slate-900">Referral System Status</p>
//                 <p className="text-xs text-slate-500 font-medium mt-1">When disabled, users cannot generate codes or claim rewards.</p>
//               </div>
//               <label className="relative cursor-pointer">
//                 <input 
//                   type="checkbox" 
//                   className="sr-only peer"
//                   {...register('referral_system_enabled')}
//                 />
//                 <div className="w-14 h-8 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
//               </label>
//             </div>

//             {/* REWARD AMOUNT */}
//             <div className={`space-y-2 transition-opacity ${!isEnabled && 'opacity-50 pointer-events-none'}`}>
//               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
//                 <Coins size={12} /> Reward per Successful Referral
//               </label>
//               <div className="relative">
//                 <input 
//                   type="number"
//                   step="0.1"
//                   {...register('reward_credits_per_referral', { valueAsNumber: true })}
//                   className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
//                 />
//                 <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">Credits</span>
//               </div>
//               <p className="text-xs text-slate-500 font-medium ml-1">Credits awarded to the referrer after the new user's first order.</p>
//             </div>

//             {/* CONVERSION RATE */}
//             <div className={`space-y-2 transition-opacity ${!isEnabled && 'opacity-50 pointer-events-none'}`}>
//               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
//                 <Power size={12} /> Credit Conversion Rate
//               </label>
//               <div className="relative">
//                 <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">1 Credit = </span>
//                 <input 
//                   type="number"
//                   step="0.01"
//                   {...register('credit_conversion_rate', { valueAsNumber: true })}
//                   className="w-full pl-24 pr-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
//                 />
//                 <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">AED</span>
//               </div>
//               <p className="text-xs text-slate-500 font-medium ml-1">How much monetary value 1 credit holds during checkout.</p>
//             </div>
//           </div>
//         </div>

//         {/* SUBMIT */}
//         <div className="flex justify-end">
//           <button 
//             type="submit"
//             disabled={mutation.isPending}
//             className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-primary transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-50"
//           >
//             {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
//             Save Configurations
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };