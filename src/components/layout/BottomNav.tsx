import { Link, useLocation } from 'react-router-dom';
import { getNavItems } from '@/utils/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/utils/cn';

export const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const navItems = getNavItems(user?.role); // Fetch links dynamically

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 block border-t border-slate-200 bg-white/80 backdrop-blur-lg pb-safe md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors w-full h-full',
                isActive ? 'text-brand-primary' : 'text-slate-400'
              )}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};