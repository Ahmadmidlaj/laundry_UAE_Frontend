import { parseISO, format } from 'date-fns';

/**
 * Transforms "1" into "ORD-2026-0001"
 */
export const formatOrderId = (id: number | string): string => {
  const year = new Date().getFullYear();
  return `ORD-${year}-${String(id).padStart(4, '0')}`;
};

/**
 * Handles "Invalid Date" by providing a fallback and safe parsing
 */
export const formatSafeDate = (dateStr: string | null | undefined, formatStr = 'dd MMM yyyy, p') => {
  if (!dateStr) return 'Date TBD';
  try {
    // Replace space with T for SQL compatibility if needed
    const safeStr = dateStr.replace(' ', 'T');
    const date = parseISO(safeStr);
    return format(date, formatStr);
  } catch (error) {
    console.error("Date Parsing Error:", dateStr);
    return 'Invalid Date';
  }
};

export const getPickupStatus = (dateString: string) => {
  const pickupDate = new Date(dateString);
  const today = new Date();
  
  // Reset hours to compare only dates
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(pickupDate);
  compareDate.setHours(0, 0, 0, 0);

  const diffTime = compareDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: "Overdue", color: "text-red-600 bg-red-50 border-red-100" };
  if (diffDays === 0) return { label: "Today", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
  if (diffDays === 1) return { label: "Tomorrow", color: "text-blue-600 bg-blue-50 border-blue-100" };
  
  return { 
    label: pickupDate.toLocaleDateString('en-AE', { day: 'numeric', month: 'short' }), 
    color: "text-slate-600 bg-slate-50 border-slate-100" 
  };
};