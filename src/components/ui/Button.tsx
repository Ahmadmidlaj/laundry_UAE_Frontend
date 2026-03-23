// import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { type LucideIcon } from 'lucide-react';
// import { clsx, type ClassValue } from 'clsx';
// import { twMerge } from 'tailwind-merge';

// Utility to merge tailwind classes safely
// function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  isLoading?: boolean;
  icon?: LucideIcon;
}

export const Button = ({ 
  className, variant = 'primary', isLoading, icon: Icon, children, ...props 
}: ButtonProps) => {
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-blue-700 shadow-sm',
    secondary: 'bg-brand-secondary text-white hover:bg-purple-700',
    outline: 'border-2 border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
    danger: 'bg-brand-error text-white hover:bg-red-600',
  };

  return (
    <button
      className={cn(
        'relative flex items-center justify-center gap-2 px-6 py-3 font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-premium',
        variants[variant],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <>
          {Icon && <Icon size={18} />}
          {children}
        </>
      )}
    </button>
  );
};