import api from '@/api/axios';

export const staffService = {
  // 1. View Pickup Queue
  getPickupQueue: async () => {
    const response = await api.get('/operations/pickup-queue');
    return response.data;
  },

  // 2. Confirm Pickup (Uses POST instead of PATCH to match backend)
  // confirmPickup: async (orderId: number) => {
  //   // Sending an empty object {} assuming PickupCreate doesn't have mandatory fields. 
  //   // If PickupCreate requires data (like a timestamp), add it here.
  //   const response = await api.post(`/operations/${orderId}/pickup`, {});
  //   return response.data;
  // },
  confirmPickup: (orderId: number, data: { items: { item_id: number, final_quantity: number }[] }) => 
    api.post(`/operations/${orderId}/pickup`, data),

  // 3. View Delivery Queue
  getDeliveryQueue: async () => {
    const response = await api.get('/operations/delivery-queue');
    return response.data;
  },

  // 4. Confirm Delivery
  // confirmDelivery: async (orderId: number) => {
  //   const response = await api.post(`/operations/${orderId}/deliver`, {});
  //   return response.data;
  // }
  confirmDelivery: (orderId: number, data: { 
    received_amount: number, 
    payment_method: 'CASH' | 'CARD', 
    notes?: string 
  }) => api.post(`/operations/${orderId}/deliver`, data),
};