// src/layouts/MainLayout.tsx
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { cn } from '@/utils/cn';

export const MainLayout = () => {
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className={cn("min-h-screen", isAdmin ? "flex bg-slate-50" : "bg-white")}>
      {/* 1. ADMIN SIDEBAR (Desktop Only) */}
      {isAdmin && <AdminSidebar />}

      <div className="flex-1 flex flex-col min-h-screen">
        {/* 2. CUSTOMER/STAFF NAVBAR (Hide for Admin on Desktop) */}
        {!isAdmin && <Navbar />}
        
        <main className={cn(
          "flex-1 mx-auto w-full",
          isAdmin ? "p-8 max-w-7xl" : "max-w-7xl px-4 pb-32 pt-6 sm:px-6 lg:px-8"
        )}>
          <Outlet />
        </main>

        {/* 3. UNIVERSAL BOTTOM NAV (Shows on mobile for everyone) */}
        <div className={isAdmin ? "lg:hidden" : ""}>
          <BottomNav />
        </div>
      </div>
    </div>
  );
};
// import { Outlet } from 'react-router-dom';
// import { Navbar } from '@/components/layout/Navbar';
// import { BottomNav } from '@/components/layout/BottomNav';

// export const MainLayout = () => {
//   return (
//     <div className="min-h-screen bg-slate-50">
//       <Navbar />
      
//       <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 md:pb-8">
//         {/* Child routes will be rendered here */}
//         <Outlet />
//       </main>

//       <BottomNav />
//     </div>
//   );
// };