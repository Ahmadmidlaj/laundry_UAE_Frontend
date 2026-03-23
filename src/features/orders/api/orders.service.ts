import api from '@/api/axios';

export interface LaundryItem {
  id: number;
  name: string;
  base_price: number;
}

export interface OrderPayload {
  pickup_date: string;    // Backend: DateTime column
  pickup_time: string;    // Backend: String column
  items: Array<{ item_id: number; estimated_quantity: number }>;
  notes?: string;         // Added since it's in your model
}
export const ordersService = {
  // Get all items to display in the booking form
  getItems: async (): Promise<LaundryItem[]> => {
    const response = await api.get('/items/');
    return response.data;
  },

  // Submit the customer order (Stage 1)
  createOrder: async (data: OrderPayload) => {
    const response = await api.post('/orders/', data);
    return response.data;
  },

  // Get stats for the customer dashboard
  getMyStats: async () => {
    const response = await api.get('/reports/customer/my-stats');
    return response.data;
  }

 ,

getOrderDetails: async (id: string | number | undefined) => {
 if (!id || id === 'undefined' || id === 'null') {
    throw new Error("Invalid Order ID provided");
  }
  
  const response = await api.get(`/orders/${id}`);
  return response.data;
},


};