// src/features/orders/components/OrderSuccessScreen.tsx
import { Check, ArrowRight, PartyPopper, Sparkles, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  savings: number;
  pickupDateTime?: string; // <-- NEW PROP
  onClose: () => void;
}

export const OrderSuccessScreen = ({ savings, pickupDateTime, onClose }: Props) => {
  const navigate = useNavigate();

  // Helper to calculate the exact text for the window
  const getExactWindow = () => {
    if (!pickupDateTime) return "within a 1-hour window of your selected time";
    
    try {
      const timePart = pickupDateTime.split('T')[1];
      if (!timePart) return "within a 1-hour window of your selected time";

      const [hourStr, minStr] = timePart.split(':');
      const hour = parseInt(hourStr, 10);
      const min = parseInt(minStr, 10);

      const formatAMPM = (h: number, m: number) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        const displayM = m < 10 ? `0${m}` : m;
        return `${displayH}:${displayM} ${ampm}`;
      };

      const startTime = formatAMPM(hour, min);
      const endHour = (hour + 1) % 24; // Handles 23:00 wrapping to 00:00
      const endTime = formatAMPM(endHour, min);

      return `between ${startTime} and ${endTime}`;
    } catch {
      return "within a 1-hour window of your selected time";
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="relative mb-8">
        <div className="h-24 w-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-200 animate-bounce">
          <Check size={48} strokeWidth={3} />
        </div>
        <Sparkles className="absolute -top-4 -right-4 text-amber-400 animate-pulse" size={32} />
        <PartyPopper className="absolute -bottom-4 -left-4 text-blue-500 animate-pulse" size={32} />
      </div>

      <h2 className="text-4xl font-black text-slate-900 tracking-tighter text-center mb-2">Order Confirmed!</h2>
      <p className="text-slate-500 font-medium text-center mb-8">We've received your request and our team is warming up the van.</p>

      {savings > 0 && (
        <div className="bg-emerald-50 border border-emerald-100 px-8 py-6 rounded-[2.5rem] mb-6 text-center w-full max-w-sm">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Smart Move!</p>
          <p className="text-2xl font-black text-emerald-700">You saved AED {savings.toFixed(2)}</p>
        </div>
      )}

      {/* UPDATED: Exact 1-Hour Window Notice */}
      <div className="bg-slate-50 border border-slate-100 px-6 py-5 rounded-[2rem] mb-12 flex items-start gap-4 max-w-sm w-full">
        <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
          <Clock className="text-brand-primary" size={20} />
        </div>
        <div className="text-left">
          <p className="text-xs font-black uppercase tracking-widest text-slate-900 mb-1">Arrival Window</p>
          <p className="text-xs font-bold text-slate-500 leading-relaxed">
            To account for traffic, our driver will arrive <span className="text-brand-primary font-black">{getExactWindow()}</span>.
          </p>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <button 
          onClick={() => { onClose(); navigate('/orders'); }}
          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-brand-primary transition-all shadow-xl shadow-slate-200"
        >
          View Order Status <ArrowRight size={18} />
        </button>
        <button 
          onClick={() => { onClose(); navigate('/'); }}
          className="w-full text-slate-400 font-bold py-2 hover:text-slate-900 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

// // src/features/orders/components/OrderSuccessScreen.tsx
// import { Check, ArrowRight, PartyPopper, Sparkles, Clock } from 'lucide-react'; // <-- Added Clock icon
// import { useNavigate } from 'react-router-dom';

// interface Props {
//   savings: number;
//   onClose: () => void;
// }

// export const OrderSuccessScreen = ({ savings, onClose }: Props) => {
//   const navigate = useNavigate();

//   return (
//     <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
//       <div className="relative mb-8">
//         <div className="h-24 w-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-200 animate-bounce">
//           <Check size={48} strokeWidth={3} />
//         </div>
//         <Sparkles className="absolute -top-4 -right-4 text-amber-400 animate-pulse" size={32} />
//         <PartyPopper className="absolute -bottom-4 -left-4 text-blue-500 animate-pulse" size={32} />
//       </div>

//       <h2 className="text-4xl font-black text-slate-900 tracking-tighter text-center mb-2">Order Confirmed!</h2>
//       <p className="text-slate-500 font-medium text-center mb-8">We've received your request and our team is warming up the van.</p>

//       {savings > 0 && (
//         <div className="bg-emerald-50 border border-emerald-100 px-8 py-6 rounded-[2.5rem] mb-6 text-center w-full max-w-sm">
//           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Smart Move!</p>
//           <p className="text-2xl font-black text-emerald-700">You saved AED {savings.toFixed(2)}</p>
//         </div>
//       )}

//       {/* NEW: 1-Hour Window Notice */}
//       <div className="bg-slate-50 border border-slate-100 px-6 py-5 rounded-[2rem] mb-12 flex items-start gap-4 max-w-sm w-full">
//         <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
//           <Clock className="text-brand-primary" size={20} />
//         </div>
//         <div className="text-left">
//           <p className="text-xs font-black uppercase tracking-widest text-slate-900 mb-1">Arrival Window</p>
//           <p className="text-xs font-bold text-slate-500 leading-relaxed">
//             To account for traffic, our driver will arrive within a <span className="text-brand-primary">1-hour window</span> of your selected time.
//           </p>
//         </div>
//       </div>

//       <div className="w-full max-w-xs space-y-4">
//         <button 
//           onClick={() => { onClose(); navigate('/orders'); }}
//           className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-brand-primary transition-all shadow-xl shadow-slate-200"
//         >
//           View Order Status <ArrowRight size={18} />
//         </button>
//         <button 
//           onClick={() => { onClose(); navigate('/'); }}
//           className="w-full text-slate-400 font-bold py-2 hover:text-slate-900 transition-colors"
//         >
//           Back to Home
//         </button>
//       </div>
//     </div>
//   );
// };
// // src/features/orders/components/OrderSuccessScreen.tsx
// import { Check, ArrowRight, PartyPopper, Sparkles } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';

// interface Props {
//   savings: number;
//   onClose: () => void;
// }

// export const OrderSuccessScreen = ({ savings, onClose }: Props) => {
//   const navigate = useNavigate();

//   return (
//     <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
//       <div className="relative mb-8">
//         <div className="h-24 w-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-200 animate-bounce">
//           <Check size={48} strokeWidth={3} />
//         </div>
//         <Sparkles className="absolute -top-4 -right-4 text-amber-400 animate-pulse" size={32} />
//         <PartyPopper className="absolute -bottom-4 -left-4 text-blue-500 animate-pulse" size={32} />
//       </div>

//       <h2 className="text-4xl font-black text-slate-900 tracking-tighter text-center mb-2">Order Confirmed!</h2>
//       <p className="text-slate-500 font-medium text-center mb-12">We've received your request and our team is warming up the van.</p>

//       {savings > 0 && (
//         <div className="bg-emerald-50 border border-emerald-100 px-8 py-6 rounded-[2.5rem] mb-12 text-center">
//           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Smart Move!</p>
//           <p className="text-2xl font-black text-emerald-700">You saved AED {savings.toFixed(2)}</p>
//         </div>
//       )}

//       <div className="w-full max-w-xs space-y-4">
//         <button 
//           onClick={() => { onClose(); navigate('/orders'); }}
//           className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-brand-primary transition-all shadow-xl shadow-slate-200"
//         >
//           View Order Status <ArrowRight size={18} />
//         </button>
//         <button 
//           onClick={() => { onClose(); navigate('/'); }}
//           className="w-full text-slate-400 font-bold py-2 hover:text-slate-900 transition-colors"
//         >
//           Back to Home
//         </button>
//       </div>
//     </div>
//   );
// };