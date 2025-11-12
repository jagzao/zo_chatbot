import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Middleware para manejar:
 * - Autenticación con Supabase (refresh session)
 * - Detección de organización (multitenant)
 * - Headers de seguridad
 */
export async function middleware(request: NextRequest) {
  // Update Supabase session
  const response = await updateSession(request);

  // TODO: Implementar detección de organización
  // TODO: Agregar header X-Organization-ID

  // Headers de seguridad básicos
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/webhook (webhooks need special handling)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/webhook).*)",
  ],
};
