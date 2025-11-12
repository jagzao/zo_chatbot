"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type User = Database["public"]["Tables"]["users"]["Row"];

interface OrganizationContextType {
  organization: Organization | null;
  organizations: Organization[];
  user: User | null;
  isLoading: boolean;
  switchOrganization: (organizationId: string) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const loadOrganizations = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setIsLoading(false);
        return;
      }

      // Get user profile
      const { data: userProfile } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      setUser(userProfile);

      // Get user's organizations
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", authUser.id);

      if (!memberships || memberships.length === 0) {
        setOrganizations([]);
        setOrganization(null);
        setIsLoading(false);
        return;
      }

      // Get full organization details
      const orgIds = memberships.map((m) => m.organization_id);
      const { data: orgs } = await supabase
        .from("organizations")
        .select("*")
        .in("id", orgIds);

      const organizations = orgs || [];
      setOrganizations(organizations);

      // Set current organization from localStorage or first available
      const savedOrgId = localStorage.getItem("currentOrganizationId");
      const currentOrg = savedOrgId
        ? organizations.find((o) => o.id === savedOrgId) || organizations[0] || null
        : organizations[0] || null;

      setOrganization(currentOrg);
    } catch (error) {
      console.error("Error loading organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchOrganization = (organizationId: string) => {
    const org = organizations.find((o) => o.id === organizationId);
    if (org) {
      setOrganization(org);
      localStorage.setItem("currentOrganizationId", organizationId);
    }
  };

  const refreshOrganizations = async () => {
    setIsLoading(true);
    await loadOrganizations();
  };

  useEffect(() => {
    loadOrganizations();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        loadOrganizations();
      } else if (event === "SIGNED_OUT") {
        setOrganization(null);
        setOrganizations([]);
        setUser(null);
        localStorage.removeItem("currentOrganizationId");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        organizations,
        user,
        isLoading,
        switchOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}
