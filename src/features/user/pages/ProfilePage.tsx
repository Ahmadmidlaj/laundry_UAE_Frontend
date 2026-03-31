// src/features/user/pages/ProfilePage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService, type UserUpdatePayload } from '../api/user.service';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  User, MapPin, Mail, Phone, Save, Loader2, 
  BadgeCheck, ShieldCheck, HardHat, Lock, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { user: authUser, setUser } = useAuthStore();
  
  const isCustomer = authUser?.role === 'CUSTOMER';
  const isAdmin = authUser?.role === 'ADMIN';

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userService.getMe,
    initialData: authUser
  });

  // 1. Destructure 'errors' and 'isValid' from formState
  const { register, handleSubmit, watch, resetField, formState: { isDirty, errors, isValid } } = useForm<UserUpdatePayload & { confirm_password?: string }>({
    mode: 'onChange', // Validate as the user types
    values: {
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      flat_number: profile?.flat_number || '',
      building_name: profile?.building_name || '',
    }
  });

  const newPassword = watch('password');
  const confirmPassword = watch('confirm_password');

  const mutation = useMutation({
    mutationFn: (data: UserUpdatePayload & { confirm_password?: string }) => {
      if (data.password && data.password !== data.confirm_password) {
        throw new Error("Passwords do not match");
      }

      const cleanedData: any = {};
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'confirm_password') return;
        if (key === 'password' && !value) return; 
        cleanedData[key] = value === "" ? null : value;
      });

      return userService.updateMe(cleanedData);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['userProfile'], updatedUser);
      setUser(updatedUser); 
      resetField('password');
      resetField('confirm_password');
      toast.success("Settings updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || err.response?.data?.detail || "Update failed");
    }
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="font-black uppercase tracking-widest text-[10px]">Syncing Profile...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-24 px-4 md:px-0">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 font-medium">Manage your personal and security preferences.</p>
        </div>
        
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm",
          isAdmin ? "bg-red-50 text-red-600 border-red-100" : 
          isCustomer ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
          "bg-blue-50 text-blue-600 border-blue-100"
        )}>
          {isAdmin ? <ShieldCheck size={14} /> : isCustomer ? <BadgeCheck size={14} /> : <HardHat size={14} />}
          {profile?.role}
        </div>
      </header>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        
        {/* PERSONAL DETAILS SECTION */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-900 text-white rounded-xl">
              <User size={18} />
            </div>
            <h2 className="font-black uppercase text-xs tracking-widest text-slate-900">Personal Info</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                {...register('full_name')}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  disabled
                  value={profile?.mobile}
                  className="w-full pl-12 pr-5 py-4 bg-slate-100 border-none rounded-2xl font-bold text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                {...register('email')}
                type="email"
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* ADDRESS SECTION */}
        {isCustomer && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-primary text-white rounded-xl">
                <MapPin size={18} />
              </div>
              <h2 className="font-black uppercase text-xs tracking-widest text-slate-900">Delivery Address</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Flat / Villa No.</label>
                <input 
                  {...register('flat_number')}
                  placeholder="e.g. 101"
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Building Name</label>
                <input 
                  {...register('building_name')}
                  placeholder="e.g. Al Nejoum Tower"
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: SECURITY (PIN UPDATE) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-100">
              <Lock size={18} />
            </div>
            <h2 className="font-black uppercase text-xs tracking-widest text-slate-900">Security & PIN</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* New PIN Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New PIN</label>
              <input 
                {...register('password', {
                  pattern: {
                    value: /^\d*$/,
                    message: "Digits only please"
                  },
                  minLength: {
                    value: 4,
                    message: "Minimum 4 digits required"
                  }
                })}
                type="password"
                placeholder="••••"
                maxLength={8}
                className={cn(
                  "w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none transition-all",
                  errors.password && "ring-2 ring-red-500 bg-red-50"
                )}
              />
              {errors.password && (
                <p className="text-[9px] font-bold text-red-500 flex items-center gap-1 ml-1 uppercase">
                  <AlertCircle size={10} /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm PIN Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm PIN</label>
              <input 
                {...register('confirm_password')}
                type="password"
                placeholder="••••"
                maxLength={8}
                className={cn(
                  "w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none transition-all",
                  newPassword && confirmPassword && newPassword !== confirmPassword && "ring-2 ring-red-500 bg-red-50"
                )}
              />
            </div>
          </div>
          
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center">PINs do not match</p>
          )}
        </div>

        <button 
          type="submit"
          // Button is disabled if:
          // 1. Form is not dirty AND no password is being entered
          // 2. Form is currently invalid (wrong pattern or minLength)
          // 3. Mutation is pending
          disabled={(!isDirty && !newPassword) || !isValid || mutation.isPending}
          className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-brand-primary transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          {mutation.isPending ? (
            <><Loader2 className="animate-spin" size={18} /> Syncing...</>
          ) : (
            <><Save size={18} /> Update Profile</>
          )}
        </button>
      </form>
    </div>
  );
};
// // src/features/user/pages/ProfilePage.tsx
// import { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { userService, type UserUpdatePayload } from '../api/user.service';
// import { useAuthStore } from '@/store/useAuthStore';
// import { 
//   User, MapPin, Mail, Phone, Save, Loader2, 
//   BadgeCheck, ShieldCheck, HardHat, Lock
// } from 'lucide-react';
// import { toast } from 'sonner';
// import { cn } from '@/utils/cn';

// export const ProfilePage = () => {
//   const queryClient = useQueryClient();
//   const { user: authUser, setUser } = useAuthStore();
//   const [showPassword, setShowPassword] = useState(false);
  
//   const isCustomer = authUser?.role === 'CUSTOMER';
//   const isAdmin = authUser?.role === 'ADMIN';

//   const { data: profile, isLoading } = useQuery({
//     queryKey: ['userProfile'],
//     queryFn: userService.getMe,
//     initialData: authUser
//   });

//   // Added 'password' and 'confirm_password' to the form
//   const { register, handleSubmit, watch, resetField, formState: { isDirty } } = useForm<UserUpdatePayload & { confirm_password?: string }>({
//     values: {
//       full_name: profile?.full_name || '',
//       email: profile?.email || '',
//       flat_number: profile?.flat_number || '',
//       building_name: profile?.building_name || '',
//     }
//   });

//   const newPassword = watch('password');
//   const confirmPassword = watch('confirm_password');

//   const mutation = useMutation({
//     mutationFn: (data: UserUpdatePayload & { confirm_password?: string }) => {
//       // 1. Logic: If passwords don't match, stop here.
//       if (data.password && data.password !== data.confirm_password) {
//         throw new Error("Passwords do not match");
//       }

//       // 2. Clean data: Convert empty strings to null, and remove confirm_password
//       const cleanedData: any = {};
//       Object.entries(data).forEach(([key, value]) => {
//         if (key === 'confirm_password') return;
//         // Only include password if it has a value
//         if (key === 'password' && !value) return; 
//         cleanedData[key] = value === "" ? null : value;
//       });

//       return userService.updateMe(cleanedData);
//     },
//     onSuccess: (updatedUser) => {
//       queryClient.setQueryData(['userProfile'], updatedUser);
//       setUser(updatedUser); 
//       // Clear password fields after success
//       resetField('password');
//       resetField('confirm_password');
//       toast.success("Profile and Security updated!");
//     },
//     onError: (err: any) => {
//       toast.error(err.message || err.response?.data?.detail || "Update failed");
//     }
//   });

//   if (isLoading) return (
//     <div className="flex flex-col items-center justify-center py-20 text-slate-400">
//       <Loader2 className="animate-spin mb-4" size={40} />
//       <p className="font-black uppercase tracking-widest text-[10px]">Syncing Profile...</p>
//     </div>
//   );

//   return (
//     <div className="max-w-2xl mx-auto space-y-8 pb-24 px-4 md:px-0">
//       <header className="flex justify-between items-start">
//         <div>
//           <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
//           <p className="text-slate-500 font-medium">Manage your personal and security preferences.</p>
//         </div>
        
//         <div className={cn(
//           "flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm",
//           isAdmin ? "bg-red-50 text-red-600 border-red-100" : 
//           isCustomer ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
//           "bg-blue-50 text-blue-600 border-blue-100"
//         )}>
//           {isAdmin ? <ShieldCheck size={14} /> : isCustomer ? <BadgeCheck size={14} /> : <HardHat size={14} />}
//           {profile?.role}
//         </div>
//       </header>

//       <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        
//         {/* SECTION 1: PERSONAL DETAILS */}
//         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-slate-900 text-white rounded-xl">
//               <User size={18} />
//             </div>
//             <h2 className="font-black uppercase text-xs tracking-widest text-slate-900">Personal Info</h2>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div className="space-y-2">
//               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
//               <input 
//                 {...register('full_name')}
//                 className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none transition-all"
//               />
//             </div>
//             <div className="space-y-2">
//               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile</label>
//               <div className="relative">
//                 <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
//                 <input 
//                   disabled
//                   value={profile?.mobile}
//                   className="w-full pl-12 pr-5 py-4 bg-slate-100 border-none rounded-2xl font-bold text-slate-400 cursor-not-allowed"
//                 />
//               </div>
//             </div>
//           </div>

//           <div className="space-y-2">
//             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
//             <div className="relative">
//               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
//               <input 
//                 {...register('email')}
//                 type="email"
//                 className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none transition-all"
//               />
//             </div>
//           </div>
//         </div>

//         {/* SECTION 2: ADDRESS */}
//         {isCustomer && (
//           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
//             <div className="flex items-center gap-3 mb-2">
//               <div className="p-2 bg-brand-primary text-white rounded-xl">
//                 <MapPin size={18} />
//               </div>
//               <h2 className="font-black uppercase text-xs tracking-widest text-slate-900">Delivery Address</h2>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Flat / Villa No.</label>
//                 <input 
//                   {...register('flat_number')}
//                   placeholder="e.g. 101"
//                   className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none transition-all"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Building Name</label>
//                 <input 
//                   {...register('building_name')}
//                   placeholder="e.g. Al Nejoum Tower"
//                   className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none transition-all"
//                 />
//               </div>
//             </div>
//           </div>
//         )}

//         {/* SECTION 3: SECURITY (PASSWORD UPDATE) */}
//         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-100">
//               <Lock size={18} />
//             </div>
//             <h2 className="font-black uppercase text-xs tracking-widest text-slate-900">Security & PIN</h2>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div className="space-y-2">
//               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
//               <input 
//                 {...register('password')}
//                 type="password"
//                 placeholder="••••••••"
//                 className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none transition-all"
//               />
//             </div>
//             <div className="space-y-2">
//               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
//               <input 
//                 {...register('confirm_password')}
//                 type="password"
//                 placeholder="••••••••"
//                 className={cn(
//                   "w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none transition-all",
//                   newPassword && confirmPassword && newPassword !== confirmPassword && "ring-2 ring-red-500 bg-red-50"
//                 )}
//               />
//             </div>
//           </div>
          
//           {newPassword && confirmPassword && newPassword !== confirmPassword && (
//             <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center">Passwords do not match</p>
//           )}
//         </div>

//         <button 
//           type="submit"
//           disabled={(!isDirty && !newPassword) || mutation.isPending}
//           className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-brand-primary transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 active:scale-[0.98]"
//         >
//           {mutation.isPending ? (
//             <><Loader2 className="animate-spin" size={18} /> Updating...</>
//           ) : (
//             <><Save size={18} /> Save All Changes</>
//           )}
//         </button>
//       </form>
//     </div>
//   );
// };
// import { useForm } from 'react-hook-form';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { userService,type UserUpdatePayload } from '../api/user.service';
// import { useAuthStore } from '@/store/useAuthStore';
// import { User, MapPin, Mail, Phone, Save, Loader2, BadgeCheck, ShieldCheck, HardHat } from 'lucide-react';
// import { toast } from 'sonner';
// import { cn } from '@/utils/cn';

// export const ProfilePage = () => {
//   const queryClient = useQueryClient();
//   const { user: authUser, setUser } = useAuthStore();
//   const isCustomer = authUser?.role === 'CUSTOMER';
//   const isAdmin = authUser?.role === 'ADMIN';

//   const { data: profile, isLoading } = useQuery({
//     queryKey: ['userProfile'],
//     queryFn: userService.getMe,
//     initialData: authUser
//   });

//   const { register, handleSubmit, formState: { isDirty } } = useForm<UserUpdatePayload>({
//     values: {
//       full_name: profile?.full_name || '',
//       email: profile?.email || '',
//       flat_number: profile?.flat_number || '',
//       building_name: profile?.building_name || '',
//     }
//   });

//   const mutation = useMutation({
//     mutationFn: (data: UserUpdatePayload) => {
//       // FIX: Clean the data to convert empty strings to null. 
//       // This prevents the backend from throwing a 400 validation error on empty email/address strings.
//       const cleanedData = Object.fromEntries(
//         Object.entries(data).map(([key, value]) => [
//           key, 
//           value === "" ? null : value
//         ])
//       );
//       return userService.updateMe(cleanedData as UserUpdatePayload);
//     },
//     onSuccess: (updatedUser) => {
//       queryClient.setQueryData(['userProfile'], updatedUser);
//       setUser(updatedUser); 
//       toast.success("Profile updated successfully!");
//     },
//     onError: (err: any) => {
//       console.error("Update Error:", err);
//       toast.error(err.response?.data?.detail || "Update failed. Please try again.");
//     }
//   });

// //   const mutation = useMutation({
// //     mutationFn: userService.updateMe,
// //     onSuccess: (updatedUser) => {
// //       queryClient.setQueryData(['userProfile'], updatedUser);
// //       setUser(updatedUser); 
// //       toast.success("Profile updated successfully!");
// //     },
// //     onError: () => toast.error("Update failed. Please try again.")
// //   });

//   if (isLoading) return (
//     <div className="flex flex-col items-center justify-center py-20 text-slate-400">
//       <Loader2 className="animate-spin mb-4" size={40} />
//       <p className="font-black uppercase tracking-widest text-[10px]">Syncing Profile...</p>
//     </div>
//   );

//   return (
//     <div className="max-w-2xl mx-auto space-y-8 pb-12 px-4 md:px-0">
//       <header className="flex justify-between items-start">
//         <div>
//           <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
//           <p className="text-slate-500 font-medium">Manage your personal and security preferences.</p>
//         </div>
        
//         {/* Role Badge */}
//         <div className={cn(
//           "flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm",
//           isAdmin ? "bg-red-50 text-red-600 border-red-100" : 
//           isCustomer ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
//           "bg-blue-50 text-blue-600 border-blue-100"
//         )}>
//           {isAdmin ? <ShieldCheck size={14} /> : isCustomer ? <BadgeCheck size={14} /> : <HardHat size={14} />}
//           {profile?.role}
//         </div>
//       </header>

//       <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        
//         {/* SECTION 1: PERSONAL DETAILS */}
//         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 relative overflow-hidden">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-slate-900 text-white rounded-xl">
//               <User size={18} />
//             </div>
//             <h2 className="font-black uppercase text-xs tracking-widest text-slate-900">Personal Info</h2>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div className="space-y-2">
//               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
//               <input 
//                 {...register('full_name')}
//                 className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary"
//               />
//             </div>
//             <div className="space-y-2">
//               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile</label>
//               <div className="relative">
//                 <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
//                 <input 
//                   disabled
//                   value={profile?.mobile}
//                   className="w-full pl-12 pr-5 py-4 bg-slate-100 border-none rounded-2xl font-bold text-slate-400 cursor-not-allowed"
//                 />
//               </div>
//             </div>
//           </div>

//           <div className="space-y-2">
//             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
//             <div className="relative">
//               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
//               <input 
//                 {...register('email')}
//                 type="email"
//                 className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary"
//               />
//             </div>
//           </div>
//         </div>

//         {/* SECTION 2: ADDRESS (Only shown/emphasized for Customers) */}
//         {isCustomer && (
//           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
//             <div className="flex items-center gap-3 mb-2">
//               <div className="p-2 bg-brand-primary text-white rounded-xl">
//                 <MapPin size={18} />
//               </div>
//               <h2 className="font-black uppercase text-xs tracking-widest text-slate-900">Pickup & Delivery Address</h2>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Flat / Villa No.</label>
//                 <input 
//                   {...register('flat_number')}
//                   placeholder="e.g. 101"
//                   className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Building Name</label>
//                 <input 
//                   {...register('building_name')}
//                   placeholder="e.g. Al Nejoum Tower"
//                   className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary"
//                 />
//               </div>
//             </div>
//           </div>
//         )}

//         <button 
//           type="submit"
//           disabled={!isDirty || mutation.isPending}
//           className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-brand-primary transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 active:scale-[0.98]"
//         >
//           {mutation.isPending ? (
//             <><Loader2 className="animate-spin" size={18} /> Updating...</>
//           ) : (
//             <><Save size={18} /> Save Settings</>
//           )}
//         </button>
//       </form>
//     </div>
//   );
// };