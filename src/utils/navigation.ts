import { Home, ClipboardList, User, LayoutDashboard, Truck, Package, Tag, Users } from 'lucide-react';

type Role = 'CUSTOMER' | 'ADMIN' | 'EMPLOYEE' | undefined;

export const getNavItems = (role: Role) => {
  switch (role) {
    case 'ADMIN':
      return [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Users', path: '/admin/users', icon: Users },
        { label: 'Offers', path: '/admin/offers', icon: Tag },
        { label: 'Profile', path: '/profile', icon: User },
      ];
    case 'EMPLOYEE':
      return [
        { label: 'Pickups', path: '/ops/pickup', icon: Package },
        { label: 'Deliveries', path: '/ops/delivery', icon: Truck },
        { label: 'Profile', path: '/profile', icon: User },
      ];
    case 'CUSTOMER':
    default:
      return [
        { label: 'Home', path: '/', icon: Home },
        { label: 'Orders', path: '/orders', icon: ClipboardList },
        { label: 'Profile', path: '/profile', icon: User },
      ];
  }
};