import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useSidebar } from '@/hooks/useSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { collapsed, toggle } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
