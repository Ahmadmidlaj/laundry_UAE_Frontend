// src/features/auth/pages/RegisterPage.tsx
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/auth.service';
import { toast } from 'sonner';
import { User, Phone, Mail, Lock, ArrowRight, Loader2, Building2, Home, CheckCircle2, Circle } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from "zod";

const BUILDING_DATA: Record<string, string[]> = {
  "Al Nahda Tower": ["101", "102", "201", "202", "301"],
  "Silicon Oasis - Gate 1": ["A-12", "A-13", "B-01", "B-02"],
  "Marina Heights": ["1201", "1202", "1405"],
  "Business Bay Residences": ["601", "602", "705"],
};

const registerSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  mobile: z.string().min(10, "Valid phone number required"),
  email: z.string().email().optional().or(z.literal('')),
  building_name: z.string().min(1, "Please select a building"),
  other_building: z.string().optional(),
  flat_number: z.string().min(1, "Flat number is required"),
  password: z.string().regex(/^\d{4,}$/, "Must be at least 4 digits (numbers only)"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  const selectedBuilding = watch('building_name');
  const passwordValue = watch('password') || '';
  const availableFlats = BUILDING_DATA[selectedBuilding] || [];

  const mutation = useMutation({
    mutationFn: (data: RegisterForm) => {
      const finalBuilding = data.building_name === 'Other' ? data.other_building : data.building_name;
      return authService.register({
        ...data,
        building_name: finalBuilding,
        email: data.email === "" ? null : data.email,
      });
    },
    onSuccess: () => {
      toast.success("Account created! Please login.");
      navigate('/login');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Registration failed")
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Join Us.</h2>
          <p className="mt-2 text-slate-500 font-medium">Professional care for your favorites.</p>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 space-y-5">
            
            {/* Standard Inputs */}
            <div className="space-y-4">
               <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input {...register('full_name')} placeholder="Full Name" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none" />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input {...register('mobile')} placeholder="Mobile Number" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none" />
              </div>
            </div>

            <hr className="border-slate-50" />

            {/* Dynamic Building/Flat Logic */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Address Details</p>
              
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <select {...register('building_name')} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none appearance-none">
                  <option value="">Select Building</option>
                  {Object.keys(BUILDING_DATA).map(b => <option key={b} value={b}>{b}</option>)}
                  <option value="Other">Other Building...</option>
                </select>
              </div>

              {selectedBuilding === 'Other' && (
                <input {...register('other_building')} placeholder="Enter Building Name" className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-900 animate-in fade-in slide-in-from-top-2 outline-none" />
              )}

              <div className="relative">
                <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                {selectedBuilding && selectedBuilding !== 'Other' ? (
                  <select {...register('flat_number')} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none appearance-none">
                    <option value="">Select Flat Number</option>
                    {availableFlats.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                ) : (
                  <input {...register('flat_number')} placeholder="Flat / Villa Number" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none" />
                )}
              </div>
            </div>

            <hr className="border-slate-50" />

            {/* Password with Visual Requirements */}
            <div className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  {...register('password')} 
                  type="password" 
                  inputMode="numeric"
                  placeholder="Set 4-Digit PIN" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none" 
                />
              </div>
              <div className="flex gap-4 px-2">
                <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight transition-colors ${passwordValue.length >= 4 ? 'text-emerald-500' : 'text-slate-300'}`}>
                  {passwordValue.length >= 4 ? <CheckCircle2 size={12}/> : <Circle size={12}/>} 4+ Digits
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight transition-colors ${/^\d+$/.test(passwordValue) && passwordValue !== '' ? 'text-emerald-500' : 'text-slate-300'}`}>
                  {/^\d+$/.test(passwordValue) && passwordValue !== '' ? <CheckCircle2 size={12}/> : <Circle size={12}/>} Numbers Only
                </div>
              </div>
            </div>
          </div>

          <button disabled={mutation.isPending} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-brand-primary transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-70">
            {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <>Create Account <ArrowRight size={16} /></>}
          </button>
        </form>
        
        <p className="text-center text-slate-500 font-bold text-sm">
          Already have an account? <Link to="/login" className="text-brand-primary underline">Login here</Link>
        </p>
      </div>
    </div>
  );
};
// // src/features/auth/pages/RegisterPage.tsx
// import { useForm } from 'react-hook-form';
// import { useMutation } from '@tanstack/react-query';
// import { Link, useNavigate } from 'react-router-dom';
// import { authService } from '../api/auth.service';
// import { toast } from 'sonner';
// import { User, Phone, Mail, Lock, ArrowRight, Loader2, Building2, Home } from 'lucide-react';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from "zod";

// const BUILDING_DATA: Record<string, string[]> = {
//   "Al Nahda Tower": ["101", "102", "201", "202", "301"],
//   "Silicon Oasis - Gate 1": ["A-12", "A-13", "B-01", "B-02"],
//   "Marina Heights": ["1201", "1202", "1405"],
//   "Business Bay Residences": ["601", "602", "705"],
// };


// const registerSchema = z.object({
//   full_name: z.string().min(2, "Name is required"),
//   mobile: z.string().min(10, "Valid phone number required"),
//   email: z.string().email().optional().or(z.literal('')),
//   building_name: z.string().min(1, "Please select a building"),
//   other_building: z.string().optional(),
//   flat_number: z.string().min(1, "Flat number is required"),
//   password: z.string().regex(/^\d{4,}$/, "Password must be at least 4 digits (numbers only)"),
// });

// type RegisterForm = z.infer<typeof registerSchema>;

// export const RegisterPage = () => {
//   const navigate = useNavigate();
  
//   const { 
//     register, 
//     handleSubmit, 
//     watch, 
//     formState: { errors } 
//   } = useForm<RegisterForm>({
//     resolver: zodResolver(registerSchema)
//   });

// const selectedBuilding = watch('building_name');
// const availableFlats = BUILDING_DATA[selectedBuilding] || [];

//   const mutation = useMutation({
//     mutationFn: (data: RegisterForm) => {
//       // Map "Other" building name and clean data
//       const finalBuilding = data.building_name === 'Other' ? data.other_building : data.building_name;
      
//       const payload = {
//         full_name: data.full_name,
//         mobile: data.mobile,
//         email: data.email === "" ? null : data.email,
//         building_name: finalBuilding,
//         flat_number: data.flat_number,
//         password: data.password
//       };

//       return authService.register(payload);
//     },
//     onSuccess: () => {
//       toast.success("Account created! Please login.");
//       navigate('/login');
//     },
//     onError: (err: any) => {
//       toast.error(err.response?.data?.detail || "Registration failed");
//     }
//   });

//   return (
//     <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6">
//       <div className="max-w-md w-full mx-auto space-y-8">
//         <div className="text-center">
//           <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Join Us.</h2>
//           <p className="mt-2 text-slate-500 font-medium">Create your 4 STAR LAUNDRY account</p>
//         </div>

//         <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
//           <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 space-y-5">
            
//             {/* Full Name */}
//             <div className="relative">
//               <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//               <input 
//                 {...register('full_name')}
//                 placeholder="Full Name"
//                 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary transition-all outline-none"
//               />
//               {errors.full_name && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold uppercase">{errors.full_name.message}</p>}
//             </div>

//             {/* Mobile */}
//             <div className="relative">
//               <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//               <input 
//                 {...register('mobile')}
//                 placeholder="Mobile Number"
//                 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none"
//               />
//               {errors.mobile && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold uppercase">{errors.mobile.message}</p>}
//             </div>

//             {/* Email */}
//             <div className="relative">
//               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//               <input 
//                 {...register('email')}
//                 type="email"
//                 placeholder="Email (Optional)"
//                 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none"
//               />
//             </div>

//             <hr className="border-slate-50" />

//             {/* Address Group */}
//             <div className="space-y-3">
//               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Delivery Address</p>
              
//               {/* Building Dropdown */}
//               <div className="relative">
//                 <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
//                 <select 
//                   {...register('building_name')}
//                   className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none appearance-none"
//                 >
//                   <option value="">Select Building</option>
//                   {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
//                 </select>
//               </div>

//               {/* Conditional "Other" Building Input */}
//               {selectedBuilding === 'Other' && (
//                 <div className="animate-in fade-in slide-in-from-top-2">
//                   <input 
//                     {...register('other_building')}
//                     placeholder="Enter Building Name"
//                     className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none"
//                   />
//                 </div>
//               )}

//               {/* Flat Number */}
//               <div className="relative">
//                 <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//                 <input 
//                   {...register('flat_number')}
//                   placeholder="Flat / Villa Number"
//                   className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none"
//                 />
//                 {errors.flat_number && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold uppercase">{errors.flat_number.message}</p>}
//               </div>
//             </div>

//             <hr className="border-slate-50" />

//             {/* Password */}
//             <div className="relative">
//               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//               <input 
//                 {...register('password')}
//                 type="password"
//                 inputMode="numeric"
//                 pattern="[0-9]*"
//                 placeholder="Password (Numeric 4+ Digits)"
//                 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none"
//               />
//               {errors.password && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold uppercase">{errors.password.message}</p>}
//             </div>
//           </div>

//           <button 
//             type="submit"
//             disabled={mutation.isPending}
//             className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-brand-primary transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70"
//           >
//             {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : (
//               <>Create Account <ArrowRight size={16} /></>
//             )}
//           </button>
//         </form>

//         <p className="text-center text-slate-500 font-bold text-sm">
//           Already have an account? <Link to="/login" className="text-brand-primary underline">Login here</Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// import { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';

// // Predefined building list (we can move this to a constants file later)
// const BUILDINGS = [
//   "Al Nahda Tower",
//   "Silicon Oasis - Gate 1",
//   "Marina Heights",
//   "Business Bay Residences",
//   "Other"
// ];

// const registerSchema = z.zobject({
//   phone_number: z.string().min(10, "Valid phone number required"),
//   full_name: z.string().min(2, "Name is required"),
//   password: z.string().regex(/^\d{4,}$/, "Password must be at least 4 digits (numbers only)"),
//   building_name: z.string().min(1, "Please select a building"),
//   other_building: z.string().optional(),
//   flat_number: z.string().min(1, "Flat number is required"),
// });

// type RegisterForm = z.infer<typeof registerSchema>;

// export const RegisterPage = () => {
//   const [selectedBuilding, setSelectedBuilding] = useState('');
  
//   const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>({
//     resolver: zodResolver(registerSchema)
//   });

//   const onSubmit = (data: RegisterForm) => {
//     // If "Other" is selected, use the manual building name
//     const finalData = {
//       ...data,
//       building_name: data.building_name === 'Other' ? data.other_building : data.building_name
//     };
//     console.log("Registering with:", finalData);
//     // authService.register(finalData)...
//   };

//   return (
//     <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 bg-white rounded-3xl shadow-sm">
//       {/* Full Name & Phone Number inputs here... */}

//       {/* Building Dropdown */}
//       <div className="space-y-1">
//         <label className="text-xs font-bold text-slate-500 uppercase ml-2">Building</label>
//         <select 
//           {...register('building_name')}
//           onChange={(e) => setSelectedBuilding(e.target.value)}
//           className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none ring-2 ring-transparent focus:ring-brand-primary transition-all"
//         >
//           <option value="">Select Building</option>
//           {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
//         </select>
//         {errors.building_name && <p className="text-red-500 text-xs mt-1">{errors.building_name.message}</p>}
//       </div>

//       {/* Conditional Manual Building Input */}
//       {selectedBuilding === 'Other' && (
//         <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
//           <label className="text-xs font-bold text-slate-500 uppercase ml-2">Enter Building Name</label>
//           <input 
//             {...register('other_building')}
//             className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none ring-2 ring-transparent focus:ring-brand-primary transition-all"
//             placeholder="e.g. Skyline Apartments"
//           />
//         </div>
//       )}

//       {/* Flat Number */}
//       <div className="space-y-1">
//         <label className="text-xs font-bold text-slate-500 uppercase ml-2">Flat / Villa Number</label>
//         <input 
//           {...register('flat_number')}
//           className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none ring-2 ring-transparent focus:ring-brand-primary transition-all"
//           placeholder="e.g. 402"
//         />
//         {errors.flat_number && <p className="text-red-500 text-xs mt-1">{errors.flat_number.message}</p>}
//       </div>

//       {/* Password - Numeric Only */}
//       <div className="space-y-1">
//         <label className="text-xs font-bold text-slate-500 uppercase ml-2">Password (4+ Digits)</label>
//         <input 
//           type="password"
//           inputMode="numeric"
//           {...register('password')}
//           className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none ring-2 ring-transparent focus:ring-brand-primary transition-all"
//           placeholder="XXXX"
//         />
//         {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
//       </div>

//       <button type="submit" className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-primary transition-colors">
//         Create Account
//       </button>
//     </form>
//   );
// };





// // src/features/auth/pages/RegisterPage.tsx
// import { useForm } from 'react-hook-form';
// import { useMutation } from '@tanstack/react-query';
// import { Link, useNavigate } from 'react-router-dom';
// import { authService } from '../api/auth.service';
// import { toast } from 'sonner';
// import { User, Phone, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

// export const RegisterPage = () => {
//   const navigate = useNavigate();
//   const { register, handleSubmit, formState: { errors } } = useForm();

//   const mutation = useMutation({
//   mutationFn: (data: any) => {
//     // Clean the data: Convert empty strings to null or remove them
//     const cleanedData = Object.fromEntries(
//       Object.entries(data).map(([key, value]) => [
//         key, 
//         value === "" ? null : value // Convert "" to null
//       ])
//     );
//     return authService.register(cleanedData);
//   },
//   onSuccess: () => {
//     toast.success("Account created! Please login.");
//     navigate('/login');
//   },
//     onError: (err: any) => {
//       toast.error(err.response?.data?.detail || "Registration failed");
//     }
//   });

//   return (
//     <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6">
//       <div className="max-w-md w-full mx-auto space-y-8">
//         <div className="text-center">
//           <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Join Us.</h2>
//           <p className="mt-2 text-slate-500 font-medium">Create your 4 STAR LAUNDRY account</p>
//         </div>

//         <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
//           <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 space-y-5">
            
//             {/* Full Name */}
//             <div className="relative">
//               <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//               <input 
//                 {...register('full_name', { required: true })}
//                 placeholder="Full Name"
//                 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary transition-all"
//               />
//             </div>

//             {/* Mobile & Email */}
//             <div className="grid grid-cols-1 gap-4">
//               <div className="relative">
//                 <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//                 <input 
//                   {...register('mobile', { required: true })}
//                   placeholder="Mobile Number"
//                   className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary"
//                 />
//               </div>
//               <div className="relative">
//                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//                 <input 
//                   {...register('email')}
//                   type="email"
//                   placeholder="Email (Optional)"
//                   className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary"
//                 />
//               </div>
//             </div>

//             {/* Address Group */}
//             <div className="pt-2">
//               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Location Details</p>
//               <div className="grid grid-cols-2 gap-3">
//                 <input 
//                   {...register('flat_number')}
//                   placeholder="Flat No."
//                   className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary"
//                 />
//                 <input 
//                   {...register('building_name')}
//                   placeholder="Building"
//                   className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary"
//                 />
//               </div>
//             </div>

//             {/* Password */}
//             <div className="relative">
//               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//               <input 
//                 {...register('password', { required: true, minLength: 6 })}
//                 type="password"
//                 placeholder="Create Password"
//                 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary"
//               />
//             </div>
//           </div>

//           <button 
//             type="submit"
//             disabled={mutation.isPending}
//             className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-brand-primary transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
//           >
//             {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : (
//               <>Create Account <ArrowRight size={16} /></>
//             )}
//           </button>
//         </form>

//         <p className="text-center text-slate-500 font-bold text-sm">
//           Already have an account? <Link to="/login" className="text-brand-primary underline">Login here</Link>
//         </p>
//       </div>
//     </div>
//   );
// };