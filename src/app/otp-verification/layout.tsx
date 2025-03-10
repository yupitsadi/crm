'use client';

import { ReactNode } from 'react';
import DashboardLayout from '../dashboard/layout';

// Reuse the dashboard layout for this authenticated page
export default function OtpVerificationLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 