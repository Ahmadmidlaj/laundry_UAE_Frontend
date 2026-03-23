import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, UserRole } from '../api/admin.service';
import { Shield, Mail, Phone, UserCheck, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

export const UserManagement = () => {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: adminService.getUsers,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => adminService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success("User updated successfully");
    },
    onError: () => toast.error("Failed to update user"),
  });

  if (isLoading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Loading User Directory...</div>;

  return (
    <div className="space-y-6">
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
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => updateMutation.mutate({ id: user.id, data: { is_active: !user.is_active } })}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        user.is_active ? "text-emerald-500 hover:bg-emerald-50" : "text-red-400 hover:bg-red-50"
                      )}
                      title={user.is_active ? "Deactivate User" : "Activate User"}
                    >
                      {user.is_active ? <UserCheck size={20} /> : <UserMinus size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};