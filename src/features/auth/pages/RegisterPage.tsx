// src/features/auth/pages/RegisterPage.tsx
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/auth.service';
import { toast } from 'sonner';
import { User, Phone, Mail, Lock, MapPin, ArrowRight, Loader2 } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const mutation = useMutation({
  mutationFn: (data: any) => {
    // Clean the data: Convert empty strings to null or remove them
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key, 
        value === "" ? null : value // Convert "" to null
      ])
    );
    return authService.register(cleanedData);
  },
  onSuccess: () => {
    toast.success("Account created! Please login.");
    navigate('/login');
  },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Registration failed");
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Join Us.</h2>
          <p className="mt-2 text-slate-500 font-medium">Create your 4 STAR LAUNDRY account</p>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 space-y-5">
            
            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                {...register('full_name', { required: true })}
                placeholder="Full Name"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary transition-all"
              />
            </div>

            {/* Mobile & Email */}
            <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  {...register('mobile', { required: true })}
                  placeholder="Mobile Number"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  {...register('email')}
                  type="email"
                  placeholder="Email (Optional)"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            {/* Address Group */}
            <div className="pt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Location Details</p>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  {...register('flat_number')}
                  placeholder="Flat No."
                  className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary"
                />
                <input 
                  {...register('building_name')}
                  placeholder="Building"
                  className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                {...register('password', { required: true, minLength: 6 })}
                type="password"
                placeholder="Create Password"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-brand-primary transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : (
              <>Create Account <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <p className="text-center text-slate-500 font-bold text-sm">
          Already have an account? <Link to="/login" className="text-brand-primary underline">Login here</Link>
        </p>
      </div>
    </div>
  );
};