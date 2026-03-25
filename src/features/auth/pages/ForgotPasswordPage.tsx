// src/features/auth/pages/ForgotPasswordPage.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../api/auth.service';
import { toast } from 'sonner';
import { Phone, ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ForgotPasswordPage = () => {
  const [mobile, setMobile] = useState('');
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authService.forgotPassword(mobile),
    onSuccess: (data) => {
      setSent(true);
      // NOTE: In development, we might show the token directly if SMS isn't connected
      if(data.reset_token) console.log("Dev Reset Token:", data.reset_token);
      toast.success("Reset link generated!");
    }
  });

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-8">
      <div className="max-w-sm mx-auto w-full space-y-10">
        <Link to="/login" className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
          <ArrowLeft size={14} /> Back to Login
        </Link>

        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Password Help.</h1>
          <p className="text-slate-500 font-medium">Enter your mobile number to receive a reset link.</p>
        </div>

        {!sent ? (
          <div className="space-y-6">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Mobile Number"
                className="w-full pl-12 pr-4 py-5 bg-slate-50 border-none rounded-[1.5rem] font-bold text-lg"
              />
            </div>
            <button 
              onClick={() => mutation.mutate()}
              disabled={!mobile || mutation.isPending}
              className="w-full bg-brand-primary text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {mutation.isPending ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-emerald-500">
              <KeyRound size={32} />
            </div>
            <p className="text-emerald-900 font-bold">Check your messages!</p>
            <p className="text-emerald-700/70 text-sm">If an account exists for {mobile}, you will receive a secure link shortly.</p>
          </div>
        )}
      </div>
    </div>
  );
};