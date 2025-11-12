import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type OrganizationMember = Database["public"]["Tables"]["organization_members"]["Row"];

/**
 * Get current user's organizations
 */
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  const supabase = await createClient();

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId);

  if (error) throw error;
  if (!memberships || memberships.length === 0) return [];

  const orgIds = memberships.map((m) => m.organization_id);
  const { data: organizations, error: orgsError } = await supabase
    .from("organizations")
    .select("*")
    .in("id", orgIds);

  if (orgsError) throw orgsError;

  return organizations || [];
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data;
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(id: string): Promise<Organization | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

/**
 * Check if user is member of organization
 */
export async function isUserMemberOfOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .single();

  if (error) return false;
  return !!data;
}

/**
 * Get user's role in organization
 */
export async function getUserRoleInOrganization(
  userId: string,
  organizationId: string
): Promise<"owner" | "admin" | "member" | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .single();

  if (error) return null;
  return data.role;
}

/**
 * Get organization members
 */
export async function getOrganizationMembers(organizationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_members")
    .select("*, user:users(*)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Create a new organization
 */
export async function createOrganization(
  name: string,
  slug: string,
  userId: string
): Promise<Organization> {
  const supabase = await createClient();

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name, slug })
    .select()
    .single();

  if (orgError) throw orgError;

  // Add user as owner
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: userId,
      role: "owner",
    });

  if (memberError) {
    // Rollback organization creation if adding member fails
    await supabase.from("organizations").delete().eq("id", org.id);
    throw memberError;
  }

  // Create user profile if doesn't exist
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (!existingUser) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("users").insert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || null,
      });
    }
  }

  return org;
}

/**
 * Update organization
 */
export async function updateOrganization(
  organizationId: string,
  updates: { name?: string; slug?: string }
): Promise<Organization> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", organizationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Add member to organization
 */
export async function addOrganizationMember(
  organizationId: string,
  userId: string,
  role: "admin" | "member" = "member"
): Promise<OrganizationMember> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_members")
    .insert({
      organization_id: organizationId,
      user_id: userId,
      role,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove member from organization
 */
export async function removeOrganizationMember(
  organizationId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Update member role
 */
export async function updateMemberRole(
  organizationId: string,
  userId: string,
  role: "owner" | "admin" | "member"
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  if (error) throw error;
}
