import api from '@/api/axios';

// --- Types matching your Backend Schemas ---
export enum UserRole {
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
  CUSTOMER = "CUSTOMER"
}

export interface UserResponse {
  id: number;
  full_name: string;
  email?: string;
  mobile: string;
  role: UserRole;
  is_active: boolean;
  flat_number?: string;
  building_name?: string;
}

export interface OfferResponse {
  id: number;
  name: string;
  min_order_amount: number;
  discount_amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface AdminDashboardStats {
  total_customers: number;
  new_orders: number;
  picked_up_orders: number;
  delivered_orders: number;
  total_revenue: number;
  active_offers: number;
}

export interface LaundryItem {
  id: number;
  name: string;
  base_price: number;
  is_active: boolean; // Useful if you want to "hide" items instead of deleting
}

export interface CreateItemPayload {
  name: string;
  base_price: number;
}

export const adminService = {
  // Reports
  getDashboardStats: async (): Promise<AdminDashboardStats> => 
    (await api.get('/reports/admin/dashboard')).data,

  // User Management
  getUsers: async (): Promise<UserResponse[]> => 
    (await api.get('/users/')).data,
  
  updateUser: async (id: number, data: { role?: string; is_active?: boolean }) => 
    (await api.patch(`/users/${id}`, data)).data,

  // Offer Management
  getOffers: async (): Promise<OfferResponse[]> => 
    (await api.get('/offers/')).data,
  
  createOffer: async (data: Omit<OfferResponse, 'id'>) => 
    (await api.post('/offers/', data)).data,

  /** Fetch all laundry service categories */
  getItems: async (): Promise<LaundryItem[]> => {
    const response = await api.get('/items/');
    return response.data;
  },

  /** Create a brand new laundry service item */
  createItem: async (data: CreateItemPayload): Promise<LaundryItem> => {
    const response = await api.post('/items/', data);
    return response.data;
  },

  /** Update an existing item's price or name */
  updateItem: async (id: number, data: Partial<CreateItemPayload>): Promise<LaundryItem> => {
    const response = await api.patch(`/items/${id}`, data);
    return response.data;
  },
  
  /** Toggle item availability (Optional but professional) */
  deleteItem: async (id: number): Promise<void> => {
    await api.delete(`/items/${id}`);
  }
};