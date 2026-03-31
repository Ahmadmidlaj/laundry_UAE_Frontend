// src/features/admin/pages/UserManagement.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, UserRole } from '../api/admin.service';
import { Shield, Mail, Phone, UserCheck, UserMinus, Key, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

export const UserManagement = () => {
  const queryClient = useQueryClient();
  const [resetUser, setResetUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: adminService.getUsers,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => adminService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success("Update successful");
      setResetUser(null);
      setNewPassword('');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Update failed"),
  });

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,}$/.test(newPassword)) {
      return toast.error("PIN must be at least 4 digits (numbers only)");
    }
    updateMutation.mutate({ id: resetUser.id, data: { password: newPassword } });
  };

  if (isLoading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Loading User Directory...</div>;

  return (
    <div className="space-y-6 relative">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Directory</h1>
        <p className="text-slate-500 font-medium">Manage roles and account permissions.</p>
      </header>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Level</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.full_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: #{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <Phone size={12} className="text-slate-300" /> {user.mobile}
                      </div>
                      {user.email && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <Mail size={12} className="text-slate-300" /> {user.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <select 
                      value={user.role}
                      onChange={(e) => updateMutation.mutate({ id: user.id, data: { role: e.target.value } })}
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-none outline-none ring-1 ring-inset cursor-pointer",
                        user.role === UserRole.ADMIN ? "bg-purple-50 text-purple-600 ring-purple-100" :
                        user.role === UserRole.EMPLOYEE ? "bg-blue-50 text-blue-600 ring-blue-100" :
                        "bg-slate-50 text-slate-500 ring-slate-100"
                      )}
                    >
                      <option value={UserRole.CUSTOMER}>Customer</option>
                      <option value={UserRole.EMPLOYEE}>Staff</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                    </select>
                  </td>
                  <td className="p-6 text-right space-x-2">
                    <button 
                      onClick={() => setResetUser(user)}
                      className="p-2 text-slate-400 hover:text-brand-primary hover:bg-slate-50 rounded-xl transition-all"
                      title="Reset Password"
                    >
                      <Key size={18} />
                    </button>
                    <button 
                      onClick={() => updateMutation.mutate({ id: user.id, data: { is_active: !user.is_active } })}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        user.is_active ? "text-emerald-500 hover:bg-emerald-50" : "text-red-400 hover:bg-red-50"
                      )}
                    >
                      {user.is_active ? <UserCheck size={18} /> : <UserMinus size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Reset Password</h3>
              <button onClick={() => setResetUser(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                {resetUser.full_name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-black text-slate-700">{resetUser.full_name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{resetUser.mobile}</p>
              </div>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New 4-Digit PIN</label>
                <input 
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  placeholder="XXXX"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-lg text-center tracking-[0.5em] focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2"
              >
                {updateMutation.isPending ? <Loader2 className="animate-spin" size={16}/> : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { adminService, UserRole } from '../api/admin.service';
// import { Shield, Mail, Phone, UserCheck, UserMinus,Key } from 'lucide-react';
// import { toast } from 'sonner';
// import { cn } from '@/utils/cn';

// export const UserManagement = () => {
//   const queryClient = useQueryClient();

//   const { data: users, isLoading } = useQuery({
//     queryKey: ['adminUsers'],
//     queryFn: adminService.getUsers,
//   });

//   const updateMutation = useMutation({
//     mutationFn: ({ id, data }: { id: number; data: any }) => adminService.updateUser(id, data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
//       toast.success("User updated successfully");
//     },
//     onError: () => toast.error("Failed to update user"),
//   });

//   if (isLoading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Loading User Directory...</div>;

//   return (
//     <div className="space-y-6">
//       <header>
//         <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Directory</h1>
//         <p className="text-slate-500 font-medium">Manage roles and account permissions.</p>
//       </header>

//       <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left border-collapse">
//             <thead>
//               <tr className="bg-slate-50/50 border-b border-slate-100">
//                 <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile</th>
//                 <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
//                 <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Level</th>
//                 <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {users?.map((user) => (
//                 <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
//                   <td className="p-6">
//                     <div className="flex items-center gap-3">
//                       <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
//                         {user.full_name.charAt(0)}
//                       </div>
//                       <div>
//                         <p className="font-bold text-slate-900">{user.full_name}</p>
//                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: #{user.id}</p>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="p-6">
//                     <div className="space-y-1">
//                       <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
//                         <Phone size={12} className="text-slate-300" /> {user.mobile}
//                       </div>
//                       {user.email && (
//                         <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
//                           <Mail size={12} className="text-slate-300" /> {user.email}
//                         </div>
//                       )}
//                     </div>
//                   </td>
//                   <td className="p-6">
//                     <select 
//                       value={user.role}
//                       onChange={(e) => updateMutation.mutate({ id: user.id, data: { role: e.target.value } })}
//                       className={cn(
//                         "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-none outline-none ring-1 ring-inset cursor-pointer",
//                         user.role === UserRole.ADMIN ? "bg-purple-50 text-purple-600 ring-purple-100" :
//                         user.role === UserRole.EMPLOYEE ? "bg-blue-50 text-blue-600 ring-blue-100" :
//                         "bg-slate-50 text-slate-500 ring-slate-100"
//                       )}
//                     >
//                       <option value={UserRole.CUSTOMER}>Customer</option>
//                       <option value={UserRole.EMPLOYEE}>Staff</option>
//                       <option value={UserRole.ADMIN}>Admin</option>
//                     </select>
//                   </td>
//                   <td className="p-6 text-right">
//                     {/* <button 
//                       onClick={() => updateMutation.mutate({ id: user.id, data: { is_active: !user.is_active } })}
//                       className={cn(
//                         "p-2 rounded-xl transition-all",
//                         user.is_active ? "text-emerald-500 hover:bg-emerald-50" : "text-red-400 hover:bg-red-50"
//                       )}
//                       title={user.is_active ? "Deactivate User" : "Activate User"}
//                     >
//                       {user.is_active ? <UserCheck size={20} /> : <UserMinus size={20} />}
//                     </button> */}
//               <button 
//   onClick={() => {
//     const newPin = prompt(`Set new 4-digit PIN for ${user.full_name}:`);
//     if (newPin) {
//       if (!/^\d{4,}$/.test(newPin)) {
//         return toast.error("PIN must be at least 4 digits (numbers only)");
//       }
//       updateMutation.mutate({ id: user.id, data: { password: newPin } });
//     }
//   }}
//   className="p-2 text-slate-400 hover:text-brand-primary hover:bg-slate-50 rounded-xl transition-all ml-2"
//   title="Reset Password"
// >
//   <Key size={18} />
// </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };