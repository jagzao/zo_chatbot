import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type BotFlow = Database["public"]["Tables"]["bot_flows"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];

interface BotProcessingContext {
  organizationId: string;
  conversationId: string;
  message: Message;
  history: Message[];
}

interface BotResponse {
  shouldRespond: boolean;
  response?: string;
  matchedFlow?: BotFlow;
}

/**
 * Process bot flows to generate a response
 */
export async function processBotFlows(
  context: BotProcessingContext
): Promise<BotResponse> {
  const supabase = await createClient();

  // Get active bot flows for this organization
  const { data: flows, error } = await supabase
    .from("bot_flows")
    .select("*")
    .eq("organization_id", context.organizationId)
    .eq("is_active", true)
    .order("priority", { ascending: false }); // Higher priority first

  if (error || !flows || flows.length === 0) {
    return { shouldRespond: false };
  }

  const messageContent = context.message.content.toLowerCase().trim();

  // Try to match flows in priority order
  for (const flow of flows) {
    const match = await matchFlow(flow, messageContent, context);

    if (match) {
      // Generate response based on flow type
      const response = await generateResponse(flow, context);

      return {
        shouldRespond: true,
        response,
        matchedFlow: flow,
      };
    }
  }

  // No flow matched
  return { shouldRespond: false };
}

/**
 * Check if a flow matches the current message
 */
async function matchFlow(
  flow: BotFlow,
  messageContent: string,
  context: BotProcessingContext
): Promise<boolean> {
  switch (flow.trigger_type) {
    case "keyword":
      // Check if message contains any of the keywords (comma-separated)
      if (!flow.trigger_value) return false;
      const keywords = flow.trigger_value.split(",").map((k) => k.trim().toLowerCase());
      return keywords.some((keyword) => messageContent.includes(keyword));

    case "regex":
      // Match using regex pattern
      if (!flow.trigger_value) return false;
      try {
        const regex = new RegExp(flow.trigger_value, "i");
        return regex.test(messageContent);
      } catch {
        return false;
      }

    case "always":
      // Always match (useful for welcome messages)
      return true;

    case "fallback":
      // Fallback is handled separately (lowest priority)
      // Only match if no other flows matched
      return false;

    default:
      return false;
  }
}

/**
 * Generate response based on flow type
 */
async function generateResponse(
  flow: BotFlow,
  context: BotProcessingContext
): Promise<string> {
  switch (flow.response_type) {
    case "text":
      // Simple text response
      return flow.response_content;

    case "template":
      // Replace variables in template
      return replaceTemplateVariables(flow.response_content, context);

    case "ai":
      // AI-generated response
      // This will be implemented in Phase 9
      // For now, return a placeholder
      return "Gracias por tu mensaje. Un agente te responderá pronto.";

    default:
      return flow.response_content;
  }
}

/**
 * Replace template variables with actual values
 * Variables: {contact_name}, {contact_phone}, {time}, {date}
 */
function replaceTemplateVariables(
  template: string,
  context: BotProcessingContext
): string {
  let result = template;

  // Get contact info from conversation metadata
  // This would be populated when creating the conversation
  const contactName = "Usuario"; // Placeholder

  // Replace variables
  result = result.replace(/{contact_name}/g, contactName);
  result = result.replace(/{time}/g, new Date().toLocaleTimeString("es-ES"));
  result = result.replace(/{date}/g, new Date().toLocaleDateString("es-ES"));

  return result;
}

/**
 * Get fallback response
 */
export async function getFallbackResponse(
  organizationId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data: fallbackFlow } = await supabase
    .from("bot_flows")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("trigger_type", "fallback")
    .eq("is_active", true)
    .single();

  if (!fallbackFlow) return null;

  return fallbackFlow.response_content;
}
