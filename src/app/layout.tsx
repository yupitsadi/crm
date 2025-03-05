import './globals.css';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Sidebar from '@/components/navigation/Sidebar';
import AuthWrapper from '@/components/auth/AuthWrapper';
import SidebarLayoutEffect from '@/components/navigation/SidebarLayoutEffect';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Workshop CRM",
  description: "Workshop management system for tracking and managing workshops",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthWrapper>
          <div className="flex relative">
            <Sidebar />
            <SidebarLayoutEffect />
            <div id="main-content" className="min-h-screen w-full">
              {children}
            </div>
          </div>
        </AuthWrapper>
      </body>
    </html>
  );
}
