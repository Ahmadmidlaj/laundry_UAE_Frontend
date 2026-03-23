import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, TicketPercent, Shirt, BarChart3, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/utils/cn';

const ADMIN_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin', exact: true }, // Added exact flag
  { label: 'Services', icon: Shirt, path: '/admin/items' },
  { label: 'Offers', icon: TicketPercent, path: '/admin/offers' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
];

export const AdminSidebar = () => {
  const logout = useAuthStore(state => state.logout);

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-white border-r border-slate-100 p-8">
      <div className="mb-12 px-2">
        <h2 className="text-xl font-black tracking-tighter text-slate-900">
          AlNejoum <span className="text-brand-primary italic">ADMIN</span>
        </h2>
      </div>

      <nav className="flex-1 space-y-2">
        {ADMIN_NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            // The "end" prop is the key fix here. 
            // It prevents /admin from matching /admin/items
            end={item.exact} 
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
              isActive 
                ? "bg-slate-900 text-white shadow-xl shadow-slate-200 ring-4 ring-slate-900/5" 
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            )}
          >
            {/* Adding a subtle animation to the icon when active */}
            <item.icon size={20} className={cn("transition-transform", "group-hover:scale-110")} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button 
        onClick={logout}
        className="mt-auto flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-red-400 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
      >
        <LogOut size={20} /> Logout
      </button>
    </aside>
  );
};
// import { NavLink } from 'react-router-dom';
// import { LayoutDashboard, Users, TicketPercent, Shirt, BarChart3, LogOut } from 'lucide-react';
// import { useAuthStore } from '@/store/useAuthStore';
// import { cn } from '@/utils/cn';

// const ADMIN_NAV = [
//   { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
//   { label: 'Services', icon: Shirt, path: '/admin/items' },
//   { label: 'Offers', icon: TicketPercent, path: '/admin/offers' },
//   { label: 'Users', icon: Users, path: '/admin/users' },
//   { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
// ];

// export const AdminSidebar = () => {
//   const logout = useAuthStore(state => state.logout);

//   return (
//     <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-white border-r border-slate-100 p-8">
//       <div className="mb-12 px-2">
//         <h2 className="text-xl font-black tracking-tighter text-slate-900">AlNejoum <span className="text-brand-primary italic">ADMIN</span></h2>
//       </div>

//       <nav className="flex-1 space-y-2">
//         {ADMIN_NAV.map((item) => (
//           <NavLink
//             key={item.path}
//             to={item.path}
//             className={({ isActive }) => cn(
//               "flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
//               isActive 
//                 ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
//                 : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
//             )}
//           >
//             <item.icon size={20} />
//             {item.label}
//           </NavLink>
//         ))}
//       </nav>

//       <button 
//         onClick={logout}
//         className="mt-auto flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-red-400 hover:bg-red-50 transition-all"
//       >
//         <LogOut size={20} /> Logout
//       </button>
//     </aside>
//   );
// };