import { CheckCircle2, Clock, Truck, Home, AlertCircle } from 'lucide-react';

// Simplified to match your actual operational flow
const STEPS = [
  { status: 'NEW_ORDER', label: 'Order Placed', icon: Clock },
  { status: 'PICKED_UP', label: 'Picked Up', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', icon: Home },
];

export const OrderTracker = ({ currentStatus }: { currentStatus: string }) => {
  // Handle CANCELLED status separately
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3 text-red-700 mb-6">
        <AlertCircle size={20} />
        <span className="font-bold">This order has been cancelled.</span>
      </div>
    );
  }

  // Find index. If status is IN_PROGRESS or READY_FOR_DELIVERY, 
  // we treat it as "PICKED_UP" for the customer's view.
  let activeIndex = STEPS.findIndex(step => step.status === currentStatus);
  
  // Logic Fix: If backend is in a middle state not in our 3 steps, 
  // keep the progress at "Picked Up"
  if (activeIndex === -1) {
    if (currentStatus === 'PICKED_UP' || currentStatus === 'IN_PROGRESS' || currentStatus === 'READY_FOR_DELIVERY') {
      activeIndex = 1; 
    } else {
      activeIndex = 0;
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
      <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-8">Live Tracking</h3>
      
      <div className="relative flex justify-between px-2">
        {/* Background Line */}
        <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
        
        {/* Active Progress Line */}
        <div 
          className="absolute top-5 left-0 h-1 bg-brand-primary -translate-y-1/2 z-0 rounded-full transition-all duration-700 ease-in-out" 
          style={{ width: `${(activeIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        {STEPS.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const isPending = index > activeIndex;
          const Icon = step.icon;

          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                isCompleted ? 'bg-emerald-500 text-white' : 
                isActive ? 'bg-brand-primary text-white scale-110 shadow-lg shadow-brand-primary/20' : 
                'bg-white border-2 border-slate-200 text-slate-300'
              }`}>
                {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
              </div>
              
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-black uppercase tracking-tight ${
                  isActive ? 'text-brand-primary' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 bg-brand-primary rounded-full mt-1 animate-ping" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};