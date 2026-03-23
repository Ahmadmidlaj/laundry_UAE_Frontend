
import { useMemo } from 'react';

export const useGroupedOrders = (orders: any[]) => {
  return useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];

    const groups: Record<string, any> = {};

    orders.forEach(order => {
      // 1. Safely extract customer data with fallbacks
      const customerName = order.customer?.full_name || order.customer_name || 'Guest Customer';
      const building = order.building_name || order.customer?.building_name || 'No Building';
      const flat = order.flat_number || order.customer?.flat_number || 'N/A';
      
      // 2. Create a unique key for grouping (Customer + Location)
      const customerKey = `${customerName}-${building}-${flat}`;
      
      if (!groups[customerKey]) {
        groups[customerKey] = {
          customerKey,
          customerName,
          location: `${building}, Flat ${flat}`,
          phone: order.customer?.phone || '',
          orders: [],
        };
      }
      
      groups[customerKey].orders.push(order);
    });

    return Object.values(groups);
  }, [orders]);
};
// import { useMemo } from 'react';

// export const useGroupedOrders = (orders: any[]) => {
//   return useMemo(() => {
//     if (!orders) return [];

//     const groups: Record<string, any> = {};

//     orders.forEach(order => {
//       // Create a unique key for the customer's physical location
//       const customerKey = `cust-${order.customer_id}-${order.building_name}-${order.flat_number}`;
      
//       if (!groups[customerKey]) {
//         groups[customerKey] = {
//           customerName: order.customer?.full_name || 'Unknown Customer',
//           location: `${order.building_name}, Flat ${order.flat_number}`,
//           orders: [],
//           totalItems: 0
//         };
//       }
      
//       groups[customerKey].orders.push(order);
//       groups[customerKey].totalItems += order.items?.length || 0;
//     });

//     return Object.values(groups);
//   }, [orders]);
// };