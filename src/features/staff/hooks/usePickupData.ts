import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { mapOrderResponse, type SanitizedOrder } from '@/utils/data-mappers';

export const usePickupData = () => {
  const query = useQuery({
    queryKey: ['operations', 'pickup-queue'],
    queryFn: async () => {
      const { data } = await api.get('/operations/pickup-queue');
      return data.map(mapOrderResponse);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    retry: 2,
  });

  const groupedStops = useMemo(() => {
    if (!query.data) return [];

    const groups: Record<string, { customerName: string; address: string; orders: SanitizedOrder[] }> = {};

query.data.forEach((order: any) => {    
    const key = `${order.customerName}-${order.address}`;
      if (!groups[key]) {
        groups[key] = {
          customerName: order.customerName,
          address: order.address,
          orders: [],
        };
      }
      groups[key].orders.push(order);
    });

    return Object.values(groups);
  }, [query.data]);

  return { ...query, groupedStops };
};