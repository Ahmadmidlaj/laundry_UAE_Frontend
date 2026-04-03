// src/utils/navigation.ts
import {
  Home,
  ClipboardList,
  User,
  LayoutDashboard,
  Truck,
  Package,
  Tag,
  Users,
  BarChart3,
  ListOrdered,
  Building2,
  Wallet,
} from "lucide-react";

type Role = "CUSTOMER" | "ADMIN" | "EMPLOYEE" | undefined;

export const getNavItems = (role: Role) => {
  switch (role) {
    case "ADMIN":
      return [
        { label: "Reports", path: "/admin", icon: BarChart3 },
        { label: "Orders", path: "/admin/orders", icon: ListOrdered },
        { label: "Items", path: "/admin/items", icon: Package },
        { label: "Users", path: "/admin/users", icon: Users },
        { label: "Offers", path: "/admin/offers", icon: Tag },
        { label: "Buildings", path: "/admin/buildings", icon: Tag },
        { label: "Profile", path: "/profile", icon: User },
        // { label: "Buildings", icon: Building2, path: "/admin/buildings" },
        { label: "Expenses", icon: Wallet, path: "/admin/expenses" },
        { label: "Settings", icon: Wallet, path: "/admin/settings" },
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
