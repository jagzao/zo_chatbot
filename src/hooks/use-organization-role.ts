"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/contexts/organization-context";

type Role = "owner" | "admin" | "member" | null;

/**
 * Hook to get current user's role in the active organization
 */
export function useOrganizationRole() {
  const { organization, user } = useOrganization();
  const [role, setRole] = useState<Role>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchRole = async () => {
      if (!organization || !user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("organization_members")
          .select("role")
          .eq("organization_id", organization.id)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        setRole(data.role);
      } catch (error) {
        console.error("Error fetching role:", error);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [organization, user]);

  const isOwner = role === "owner";
  const isAdmin = role === "admin" || role === "owner";
  const isMember = !!role;

  return {
    role,
    isOwner,
    isAdmin,
    isMember,
    isLoading,
  };
}
