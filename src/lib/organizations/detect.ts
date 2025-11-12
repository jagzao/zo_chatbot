import { NextRequest } from "next/server";
import { getOrganizationBySlug } from "./index";

/**
 * Extract organization identifier from request
 * Supports multiple strategies:
 * 1. Subdomain: org.example.com
 * 2. Path: example.com/org/[slug]
 * 3. Header: X-Organization-ID or X-Organization-Slug
 */
export async function detectOrganization(request: NextRequest) {
  // Strategy 1: Check custom header (for API requests)
  const orgIdHeader = request.headers.get("X-Organization-ID");
  if (orgIdHeader) {
    return { type: "id" as const, value: orgIdHeader };
  }

  const orgSlugHeader = request.headers.get("X-Organization-Slug");
  if (orgSlugHeader) {
    const org = await getOrganizationBySlug(orgSlugHeader);
    return org ? { type: "id" as const, value: org.id } : null;
  }

  // Strategy 2: Check subdomain
  const hostname = request.headers.get("host") || "";
  const subdomain = extractSubdomain(hostname);

  if (subdomain && subdomain !== "www" && subdomain !== "app") {
    const org = await getOrganizationBySlug(subdomain);
    return org ? { type: "id" as const, value: org.id } : null;
  }

  // Strategy 3: Check path (/org/[slug]/...)
  const pathMatch = request.nextUrl.pathname.match(/^\/org\/([^\/]+)/);
  if (pathMatch) {
    const slug = pathMatch[1];
    const org = await getOrganizationBySlug(slug);
    return org ? { type: "id" as const, value: org.id } : null;
  }

  // Strategy 4: Check query parameter (fallback)
  const orgSlugParam = request.nextUrl.searchParams.get("org");
  if (orgSlugParam) {
    const org = await getOrganizationBySlug(orgSlugParam);
    return org ? { type: "id" as const, value: org.id } : null;
  }

  return null;
}

/**
 * Extract subdomain from hostname
 * Examples:
 * - demo.chatbot.com -> demo
 * - www.chatbot.com -> www
 * - chatbot.com -> null
 */
function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(":")[0];

  // Split by dots
  const parts = host.split(".");

  // If only 2 parts (domain.com), no subdomain
  if (parts.length <= 2) {
    return null;
  }

  // Return first part as subdomain
  return parts[0];
}

/**
 * Build organization URL based on strategy
 */
export function buildOrganizationUrl(
  slug: string,
  baseUrl: string,
  strategy: "subdomain" | "path" = "path"
): string {
  const url = new URL(baseUrl);

  if (strategy === "subdomain") {
    // Prepend subdomain
    url.hostname = `${slug}.${url.hostname}`;
  } else {
    // Use path-based routing
    url.pathname = `/org/${slug}${url.pathname === "/" ? "" : url.pathname}`;
  }

  return url.toString();
}
