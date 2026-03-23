import { cn } from "@/utils/cn";

const statusStyles = {
  NEW_ORDER: "bg-blue-100 text-blue-700",
  PICKED_UP: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700",
  READY_FOR_DELIVERY: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
};

export const StatusBadge = ({ status }: { status: string }) => (
  <span className={cn(
    "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
    statusStyles[status as keyof typeof statusStyles] || "bg-slate-100 text-slate-600"
  )}>
    {status.replace(/_/g, ' ')}
  </span>
);