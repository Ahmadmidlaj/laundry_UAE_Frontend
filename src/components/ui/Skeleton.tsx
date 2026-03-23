export const CardSkeleton = () => (
  <div className="w-full bg-white p-5 rounded-2xl border border-slate-100 animate-pulse">
    <div className="flex justify-between mb-4">
      <div className="h-4 w-20 bg-slate-200 rounded" />
      <div className="h-4 w-12 bg-slate-200 rounded" />
    </div>
    <div className="space-y-3">
      <div className="h-3 w-full bg-slate-100 rounded" />
      <div className="h-3 w-2/3 bg-slate-100 rounded" />
    </div>
    <div className="mt-6 h-10 w-full bg-slate-200 rounded-xl" />
  </div>
);