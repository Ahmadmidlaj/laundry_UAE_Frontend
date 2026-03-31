import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/api/axios';
import { toast } from 'sonner';
import { Lock, Loader2 } from 'lucide-react';

export const ChangePasswordForm = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mutation = useMutation({
    mutationFn: (pwd: string) => api.patch('/users/me', { password: pwd }),
    onSuccess: () => {
      toast.success("Password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: () => toast.error("Failed to update password.")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) return toast.error("PIN must be at least 4 digits.");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match.");
    mutation.mutate(newPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
      <h3 className="text-lg font-black text-slate-900 mb-4">Security</h3>
      
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
        <input 
          type="password"
          placeholder="New 4-Digit PIN"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
        <input 
          type="password"
          placeholder="Confirm New PIN"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      <button 
        type="submit"
        disabled={mutation.isPending || !newPassword || !confirmPassword}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] disabled:opacity-50 flex justify-center items-center"
      >
        {mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : "Update PIN"}
      </button>
    </form>
  );
};