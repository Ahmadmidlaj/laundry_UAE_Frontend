import { formatSafeDate } from './formatters';

export const mapOrderResponse = (order: any) => {
  if (!order) return null;

  return {
    ...order,
    displayId: `ORD-${new Date(order.created_at || new Date()).getFullYear()}-${String(order.id).padStart(4, '0')}`,
    // If backend STILL forgets created_at, fallback to today to prevent UI crash
    safeCreatedAt: formatSafeDate(order.created_at || new Date().toISOString()), 
    safePickupDate: formatSafeDate(order.pickup_date),
    itemCount: order.items?.length || 0,
  };
};
// export interface SanitizedOrder {
//   id: number;
//   displayId: string;
//   customerName: string;
//   address: string;
//   itemCount: number;
//   status: string;
//   rawDate: string;
// }

// export const mapOrderResponse = (order: any): SanitizedOrder => {
//   // Defensive check: if order is null/undefined
//   if (!order) return {} as SanitizedOrder;

//   return {
//     id: order.id,
//     displayId: `ORD-${new Date(order.created_at).getFullYear()}-${String(order.id).padStart(4, '0')}`,
//     // Navigate the relationship safely
//     customerName: order.customer?.full_name || order.customer_name || 'Guest Customer',
//     address: order.customer?.address || `${order.building_name || 'No Building'}, Flat ${order.flat_number || 'N/A'}`,
//     itemCount: order.items?.length || 0,
//     status: order.status || 'PENDING',
//     rawDate: order.pickup_date || order.created_at || new Date().toISOString(),
//   };
// };