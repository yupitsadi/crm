'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/navigation/Sidebar';
import SidebarLayoutEffect from '@/components/navigation/SidebarLayoutEffect';

// This layout is for all authenticated pages (dashboard and others)
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex relative">
      <Sidebar />
      <SidebarLayoutEffect />
      <div id="main-content" className="min-h-screen w-full">
        {children}
      </div>
    </div>
  );
} 