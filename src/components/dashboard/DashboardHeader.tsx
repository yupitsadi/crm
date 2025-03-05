"use client";

import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
  user: {
    firstName: string;
    role: string;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-900">Workshop CRM</h2>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">{user.firstName}:</span>
          <span className="text-sm text-purple-600">
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 transition-colors duration-300 ease-in-out hover:text-red-800 hover:scale-105 bg-red-100 px-4 py-2 rounded-md"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
