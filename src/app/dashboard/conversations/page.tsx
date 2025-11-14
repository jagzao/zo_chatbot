import { createClient } from "@/lib/supabase/server";
import { ConversationsView } from "@/components/dashboard/conversations/conversations-view";

export default async function ConversationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user's organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return null;
  }

  // Get conversations with channel info
  const { data: conversationsRaw } = await supabase
    .from("conversations")
    .select(`
      id,
      contact_name,
      external_id,
      status,
      is_human_takeover,
      assigned_agent_id,
      created_at,
      updated_at,
      channel_id,
      channels(id, name, type)
    `)
    .eq("organization_id", membership.organization_id)
    .order("updated_at", { ascending: false });

  // Transform data to match expected type (Supabase returns channels as array)
  const conversations = (conversationsRaw || []).map((conv: any) => ({
    ...conv,
    channel: Array.isArray(conv.channels) ? conv.channels[0] : conv.channels,
  }));

  return (
    <ConversationsView
      conversations={conversations}
      organizationId={membership.organization_id}
      userId={user.id}
    />
  );
}
