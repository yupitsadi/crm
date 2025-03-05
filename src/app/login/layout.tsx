'use client';

import { ReactNode } from 'react';

// This layout is specific for the login page
export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  );
} 