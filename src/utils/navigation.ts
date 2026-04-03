// src/utils/navigation.ts
import {
  Home,
  ClipboardList,
  User,
  LayoutDashboard,
  Truck,
  PackageSearch, // Updated to match Sidebar
  Shirt,         // Updated to match Sidebar
  TicketPercent, // Updated to match Sidebar
  Users,
  BarChart3,
  Building2,     // Used for Locations/Buildings
  Wallet,
  Settings       // Added missing Settings import
} from "lucide-react";

type Role = "CUSTOMER" | "ADMIN" | "EMPLOYEE" | undefined;

export const getNavItems = (role: Role) => {
  switch (role) {
    case "ADMIN":
     return [
        { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
        { label: "Orders", path: "/admin/orders", icon: PackageSearch }, 
        { label: "Services", path: "/admin/items", icon: Shirt }, // Aligned with sidebar
        { label: "Offers", path: "/admin/offers", icon: TicketPercent }, // Aligned with sidebar
        { label: "Users", path: "/admin/users", icon: Users },
        { label: "Reports", path: "/admin/reports", icon: BarChart3 },
        { label: "Locations", path: "/admin/buildings", icon: Building2 }, // Fixed Icon & Label
        { label: "Expenses", path: "/admin/expenses", icon: Wallet },
        { label: "Settings", path: "/admin/settings", icon: Settings }, // Fixed Icon
        { label: "Profile", path: "/profile", icon: User }, // Keep for mobile nav
      ];
    case "EMPLOYEE":
      return [
        { label: "Pickups", path: "/ops/pickup", icon: Package },
        { label: "Deliveries", path: "/ops/delivery", icon: Truck },
        { label: "Profile", path: "/profile", icon: User },
      ];
    case "CUSTOMER":
    default:
      return [
        { label: "Home", path: "/", icon: Home },
        { label: "Orders", path: "/orders", icon: ClipboardList },
        { label: "Profile", path: "/profile", icon: User },
      ];
  }
};
