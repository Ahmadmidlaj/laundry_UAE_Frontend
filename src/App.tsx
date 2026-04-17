import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleGuard } from "@/components/auth/RoleGuard";

// CUSTOMER PAGES
import { CustomerHome } from "@/features/orders/pages/CustomerHome";
import { CreateOrderPage } from "./features/orders/pages/CreateOrderPage";
import { OrderDetailPage } from "./features/orders/pages/OrderDetailPage";
import { OrderHistory } from "@/features/orders/pages/OrderHistory";

// STAFF PAGES
import { PickupQueue } from "@/features/staff/pages/PickupQueue";
import { DeliveryQueue } from "@/features/staff/pages/DeliveryQueue";

// ADMIN PAGES
import { AdminDashboard } from "@/features/admin/pages/AdminDashboard";
import { UserManagement } from "@/features/admin/pages/UserManagement";
import { OfferManagement } from "@/features/admin/pages/OfferManagement";
import { PriceManagement } from "@/features/admin/pages/PriceManagement";
import { ProfilePage } from "./features/user/pages/ProfilePage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { ForgotPasswordPage } from "./features/auth/pages/ForgotPasswordPage";
import { OrderManagement } from "./features/admin/pages/OrderManagement";
import { ReportsPage } from "./features/admin/pages/ReportsPage";
import { ResetPasswordPage } from "./features/auth/pages/ResetPasswordPage";
import { BuildingManagement } from "./features/admin/pages/BuildingManagement";
import { ExpenseManagement } from "./features/admin/pages/ExpenseManagement";
import { SystemSettings } from "./features/admin/pages/SystemSettings";
import { AboutUsPage } from "./features/user/pages/AboutUsPage";


function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<LoginPage />} />
     <Route path="/register" element={<RegisterPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  {/* Add this if you want a dedicated reset page */}
  <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* AUTHENTICATED ROUTES */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          
          {/* SHARED ROUTES */}
         <Route path="/profile" element={<ProfilePage />} />
         <Route path="/about-us" element={<AboutUsPage />} />

          {/* CUSTOMER ONLY ROUTES */}
          <Route element={<RoleGuard allowedRoles={["CUSTOMER"]} />}>
            <Route path="/" element={<CustomerHome />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/orders/new" element={<CreateOrderPage />} />
          </Route>

          {/* EMPLOYEE/STAFF ONLY ROUTES */}
          <Route element={<RoleGuard allowedRoles={["EMPLOYEE"]} />}>
            {/* Redirect staff home to their primary queue */}
            <Route path="/" element={<Navigate to="/ops/pickup" replace />} />
            <Route path="/ops/pickup" element={<PickupQueue />} />
            <Route path="/ops/delivery" element={<DeliveryQueue />} />
          </Route>

          {/* ADMIN ONLY ROUTES */}
          <Route element={<RoleGuard allowedRoles={["ADMIN"]} />}>
            {/* Redirect admin root to dashboard */}
            <Route path="/" element={<Navigate to="/admin" replace />} />
            
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/offers" element={<OfferManagement />} />
            <Route path="/admin/items" element={<PriceManagement />} />
            
            <Route
              path="/admin/reports"
              element={<ReportsPage/>}
            />
            <Route path="/admin/orders" element={<OrderManagement />} />
            <Route path="/admin/buildings" element={<BuildingManagement />} />
            <Route path="/admin/expenses" element={<ExpenseManagement />} />
            <Route path="/admin/settings" element={<SystemSettings />} />
          </Route>

        </Route>
      </Route>

      {/* 404 CATCH-ALL */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;


// import { Routes, Route,Navigate } from "react-router-dom";
// import { MainLayout } from "@/layouts/MainLayout";
// import { LoginPage } from "@/features/auth/pages/LoginPage";
// import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
// import { RoleGuard } from "@/components/auth/RoleGuard";
// import { CustomerHome } from "@/features/orders/pages/CustomerHome";
// import { CreateOrderPage } from "./features/orders/pages/CreateOrderPage";
// import { OrderDetailPage } from "./features/orders/pages/OrderDetailPage";
// import { OrderHistory } from "@/features/orders/pages/OrderHistory";
// import { PickupQueue } from "@/features/staff/pages/PickupQueue";
// import { DeliveryQueue } from "@/features/staff/pages/DeliveryQueue";

// // ADMIN PAGES
// import { AdminDashboard } from "@/features/admin/pages/AdminDashboard";
// import { UserManagement } from "@/features/admin/pages/UserManagement";
// import { OfferManagement } from "@/features/admin/pages/OfferManagement";
// import { PriceManagement } from "@/features/admin/pages/PriceManagement";


// function App() {
//   return (
//     <Routes>
       
//       <Route path="/login" element={<LoginPage />} />
//       <Route path="/register" element={<div>Register UI</div>} />

//       <Route element={<ProtectedRoute />}>
//         <Route element={<MainLayout />}>
//           <Route
//             path="/profile"
//             element={<div className="p-4 font-bold">My Profile</div>}
//           />

//           {/* CUSTOMER ONLY ROUTES */}
//           <Route element={<RoleGuard allowedRoles={["CUSTOMER"]} />}>
//             {/* Swapped the placeholder for our actual CustomerHome component */}
//             <Route path="/" element={<CustomerHome />} />
//             <Route path="/orders" element={<OrderHistory />} />
//             <Route path="/orders/:id" element={<OrderDetailPage />} />
//             <Route path="/orders/new" element={<CreateOrderPage />} />
//           </Route>

//           {/* EMPLOYEE ONLY ROUTES */}
//           <Route element={<RoleGuard allowedRoles={["EMPLOYEE"]} />}>
//             <Route path="/ops/pickup" element={<PickupQueue />} />
//             <Route path="/ops/delivery" element={<DeliveryQueue />} />
//           </Route>

//        {/* ADMIN ONLY ROUTES */}
//           <Route element={<RoleGuard allowedRoles={["ADMIN"]} />}>
//             {/* Redirect admin root to dashboard */}
//             <Route path="/" element={<Navigate to="/admin" replace />} />
            
//             <Route path="/admin" element={<AdminDashboard />} />
//             <Route path="/admin/users" element={<UserManagement />} />
//             <Route path="/admin/offers" element={<OfferManagement />} />
//             <Route path="/admin/items" element={<PriceManagement />} />
            
//             <Route
//               path="/admin/reports"
//               element={<div className="p-8 font-black text-slate-400">Advanced Analytics Coming Soon...</div>}
//             />
//           </Route>
//         </Route>
//       </Route>
//     </Routes>
//   );
// }

// export default App;

// import { Routes, Route } from 'react-router-dom';
// import { MainLayout } from '@/layouts/MainLayout';
// import { LoginPage } from '@/features/auth/pages/LoginPage';
// import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
// import { RoleGuard } from '@/components/auth/RoleGuard';

// function App() {
//   return (
//     <Routes>
//       {/* Public Routes */}
//       <Route path="/login" element={<LoginPage />} />
//       <Route path="/register" element={<div>Register UI</div>} />

//       {/* Protected Routes Wrapper */}
//       <Route element={<ProtectedRoute />}>
//         <Route element={<MainLayout />}>

//           {/* Shared Routes (Everyone can see their profile) */}
//           <Route path="/profile" element={<div className="p-4 font-bold">My Profile</div>} />

//           {/* CUSTOMER ONLY ROUTES */}
//           <Route element={<RoleGuard allowedRoles={['CUSTOMER']} />}>
//             <Route path="/" element={<div className="p-4">Customer Home (Book Laundry)</div>} />
//             <Route path="/orders" element={<div className="p-4">My Order History</div>} />
//           </Route>

//           {/* EMPLOYEE ONLY ROUTES */}
//           <Route element={<RoleGuard allowedRoles={['EMPLOYEE']} />}>
//             <Route path="/ops/pickup" element={<div className="p-4">Pickup Queue</div>} />
//             <Route path="/ops/delivery" element={<div className="p-4">Delivery Queue</div>} />
//           </Route>

//           {/* ADMIN ONLY ROUTES */}
//           <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
//             <Route path="/admin" element={<div className="p-4">Admin Dashboard</div>} />
//             <Route path="/admin/users" element={<div className="p-4">Manage Users</div>} />
//             <Route path="/admin/offers" element={<div className="p-4">Manage Offers</div>} />
//           </Route>

//         </Route>
//       </Route>
//     </Routes>
//   );
// }

// export default App;
