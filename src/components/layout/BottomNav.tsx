// src/components/layout/BottomNav.tsx
import { Link, useLocation } from 'react-router-dom';
import { getNavItems } from '@/utils/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/utils/cn';

export const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const navItems = getNavItems(user?.role);

  // Smart detection: If more than 5 items, we make it swipable. Otherwise, spread evenly.
  const isScrollable = navItems.length > 5;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 block border-t border-slate-100 bg-white/90 backdrop-blur-xl pb-safe md:hidden shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
      
      {/* Tailwind trick: Hide scrollbar cross-browser while keeping scroll functionality 
        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']
      */}
      <div className={cn(
        "flex h-16 items-center px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']",
        isScrollable ? "overflow-x-auto gap-8 justify-start" : "justify-around w-full"
      )}>
        {navItems.map((item) => {
          // Precise logic: If path is '/admin', only match exactly. Otherwise, check startsWith.
          const isExact = item.path === '/admin' || item.path === '/';
          const isActive = isExact 
            ? location.pathname === item.path 
            : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-all duration-300 h-full relative',
                // If scrollable, prevent squishing (shrink-0) and give a min-width. If not, fill space evenly (flex-1)
                isScrollable ? 'shrink-0 min-w-[60px]' : 'flex-1',
                isActive ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {/* Active Indicator Dot */}
              {isActive && (
                <span className="absolute top-1 w-1 h-1 bg-brand-primary rounded-full animate-pulse" />
              )}
              
              <item.icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={cn("transition-transform", isActive && "scale-110")}
              />
              
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tighter transition-colors text-center",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
// // src/components/layout/BottomNav.tsx
// import { Link, useLocation } from 'react-router-dom';
// import { getNavItems } from '@/utils/navigation';
// import { useAuthStore } from '@/store/useAuthStore';
// import { cn } from '@/utils/cn';

// export const BottomNav = () => {
//   const location = useLocation();
//   const { user } = useAuthStore();
//   const navItems = getNavItems(user?.role);

//   return (
//     <nav className="fixed bottom-0 left-0 right-0 z-50 block border-t border-slate-100 bg-white/90 backdrop-blur-xl pb-safe md:hidden shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
//       <div className="flex h-16 items-center justify-around px-1">
//         {navItems.map((item) => {
//           // Precise logic: If path is '/admin', only match exactly. Otherwise, check startsWith.
//           const isExact = item.path === '/admin' || item.path === '/';
//           const isActive = isExact 
//             ? location.pathname === item.path 
//             : location.pathname.startsWith(item.path);

//           return (
//             <Link
//               key={item.path}
//               to={item.path}
//               className={cn(
//                 'flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-300 h-full relative',
//                 isActive ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'
//               )}
//             >
//               {/* Active Indicator Dot */}
//               {isActive && (
//                 <span className="absolute top-1 w-1 h-1 bg-brand-primary rounded-full animate-pulse" />
//               )}
              
//               <item.icon 
//                 size={20} 
//                 strokeWidth={isActive ? 2.5 : 2} 
//                 className={cn("transition-transform", isActive && "scale-110")}
//               />
              
//               <span className={cn(
//                 "text-[9px] font-black uppercase tracking-tighter transition-colors",
//                 isActive ? "opacity-100" : "opacity-70"
//               )}>
//                 {item.label}
//               </span>
//             </Link>
//           );
//         })}
//       </div>
//     </nav>
//   );
// };


// import { Link, useLocation } from 'react-router-dom';
// import { getNavItems } from '@/utils/navigation';
// import { useAuthStore } from '@/store/useAuthStore';
// import { cn } from '@/utils/cn';

// export const BottomNav = () => {
//   const location = useLocation();
//   const { user } = useAuthStore();
//   const navItems = getNavItems(user?.role); // Fetch links dynamically

//   return (
//     <nav className="fixed bottom-0 left-0 right-0 z-50 block border-t border-slate-200 bg-white/80 backdrop-blur-lg pb-safe md:hidden">
//       <div className="flex h-16 items-center justify-around">
//         {navItems.map((item) => {
//           const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
//           return (
//             <Link
//               key={item.path}
//               to={item.path}
//               className={cn(
//                 'flex flex-col items-center justify-center gap-1 transition-colors w-full h-full',
//                 isActive ? 'text-brand-primary' : 'text-slate-400'
//               )}
//             >
//               <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
//               <span className="text-[10px] font-medium">{item.label}</span>
//             </Link>
//           );
//         })}
//       </div>
//     </nav>
//   );
// };