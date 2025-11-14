"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Workflow,
  Radio,
  Users,
  BarChart3,
  Settings,
  LayoutDashboard,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Conversaciones", href: "/dashboard/conversations", icon: MessageSquare },
  { name: "Canales", href: "/dashboard/channels", icon: Radio },
  { name: "Bot Flows", href: "/dashboard/bot-flows", icon: Workflow },
  { name: "Equipo", href: "/dashboard/team", icon: Users },
  { name: "Estadísticas", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Configuración", href: "/dashboard/settings", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
            ZO
          </div>
          <span className="text-lg font-semibold text-gray-900">Chatbot</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 rounded-md bg-blue-50 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
            ?
          </div>
          <div className="flex-1 text-xs">
            <p className="font-medium text-gray-900">¿Necesitas ayuda?</p>
            <Link href="/docs" className="text-blue-600 hover:underline">
              Ver documentación
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
