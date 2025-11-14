"use client";

import { useState } from "react";
import { ChevronDown, LogOut, User as UserIcon, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  user: {
    id: string;
    email?: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

export function DashboardHeader({ user, organization }: DashboardHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    // Logout will be implemented via Supabase auth
    window.location.href = "/auth/logout";
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Organization Info */}
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-gray-400" />
        <span className="text-sm font-medium text-gray-900">{organization.name}</span>
      </div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold uppercase">
            {user.email?.[0] || "U"}
          </div>
          <span className="text-sm font-medium text-gray-700">{user.email}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {/* Dropdown Menu */}
        {showUserMenu && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />

            {/* Menu */}
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-gray-200 bg-white shadow-lg">
              <div className="p-2">
                <div className="px-3 py-2 text-xs text-gray-500">
                  Conectado como
                  <div className="mt-1 truncate font-medium text-gray-900">{user.email}</div>
                </div>
              </div>

              <div className="border-t border-gray-200 p-2">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // Navigate to profile
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <UserIcon className="h-4 w-4" />
                  Mi perfil
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
