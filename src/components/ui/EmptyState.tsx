import { PackageOpen } from "lucide-react";

export const EmptyState = ({ title, message }: { title: string; message: string }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
    <div className="bg-slate-50 p-6 rounded-full mb-4">
      <PackageOpen size={48} className="text-slate-300" />
    </div>
    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    <p className="text-sm text-slate-500 max-w-[200px] mt-1">{message}</p>
  </div>
);