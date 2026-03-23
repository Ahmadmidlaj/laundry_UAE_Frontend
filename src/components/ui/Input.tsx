import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="text-sm font-medium text-slate-700 ml-1">{label}</label>}
      <input
        className={cn(
          "w-full px-4 py-3.5 bg-surface-50 border border-slate-200 rounded-premium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400",
          error && "border-brand-error focus:ring-brand-error/20 focus:border-brand-error",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-brand-error font-medium ml-1">{error}</p>}
    </div>
  );
};