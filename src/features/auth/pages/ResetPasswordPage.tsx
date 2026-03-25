// src/features/auth/pages/ResetPasswordPage.tsx
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../api/auth.service';
import { toast } from 'sonner';
import { Lock, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authService.resetPassword({ 
      token: token || '', 
      new_password: password 
    }),
    onSuccess: () => {
      setIsSuccess(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate('/login'), 3000);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Link expired or invalid");
    }
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="font-black text-slate-900 text-xl">Invalid Reset Link</p>
          <button onClick={() => navigate('/login')} className="text-brand-primary font-bold">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-8">
      <div className="max-w-md mx-auto w-full">
        {isSuccess ? (
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">All Set!</h2>
            <p className="text-slate-500 font-medium leading-relaxed">Your password has been reset. Redirecting you to login...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex p-4 bg-brand-primary/10 rounded-3xl text-brand-primary mb-6">
                <ShieldCheck size={32} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">New Password.</h1>
              <p className="text-slate-500 font-medium">Keep it secure, keep it secret.</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full pl-12 pr-4 py-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full pl-12 pr-4 py-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary transition-all"
                />
              </div>

              <button 
                onClick={() => mutation.mutate()}
                disabled={!password || password !== confirmPassword || mutation.isPending}
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-3 disabled:opacity-30 active:scale-95 transition-all"
              >
                {mutation.isPending ? <Loader2 className="animate-spin" /> : "Update Password"}
              </button>

              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-center text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">Passwords do not match</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};