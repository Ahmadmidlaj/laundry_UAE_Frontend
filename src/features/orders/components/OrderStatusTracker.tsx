import { Check, Circle } from 'lucide-react';
import { cn } from '@/utils/cn';

const statuses = [
  { key: 'REQUESTED', label: 'Order Placed' },
  { key: 'PICKED_UP', label: 'Picked Up' },
  { key: 'IN_PROGRESS', label: 'Cleaning' },
  { key: 'OUT_FOR_DELIVERY', label: 'On its way' },
  { key: 'COMPLETED', label: 'Delivered' },
];

export const OrderStatusTracker = ({ currentStatus }: { currentStatus: string }) => {
  const currentIndex = statuses.findIndex(s => s.key === currentStatus);

  return (
    <div className="py-6">
      <div className="relative flex justify-between">
        {/* Connection Line */}
        <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-100 -z-0" />
        <div 
          className="absolute top-4 left-0 h-0.5 bg-brand-primary transition-all duration-500 -z-0" 
          style={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
        />

        {statuses.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={status.key} className="relative z-10 flex flex-col items-center gap-2">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all",
                isCompleted ? "bg-brand-primary border-brand-primary text-white" : 
                isCurrent ? "bg-white border-brand-primary text-brand-primary" : 
                "bg-white border-slate-200 text-slate-300"
              )}>
                {isCompleted ? <Check size={16} strokeWidth={3} /> : <Circle size={8} fill="currentColor" />}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider text-center max-w-[60px]",
                isCurrent ? "text-brand-primary" : "text-slate-400"
              )}>
                {status.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};