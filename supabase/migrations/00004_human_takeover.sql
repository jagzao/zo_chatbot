-- Add human takeover fields to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS is_human_takeover BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS takeover_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_agent_response_at TIMESTAMPTZ;

-- Add index for querying conversations with human takeover
CREATE INDEX IF NOT EXISTS idx_conversations_human_takeover
ON conversations(is_human_takeover, assigned_agent_id)
WHERE is_human_takeover = true;

-- Add comment
COMMENT ON COLUMN conversations.is_human_takeover IS
'When true, bot will not respond automatically. A human agent is handling the conversation.';

COMMENT ON COLUMN conversations.assigned_agent_id IS
'User ID of the agent who took over the conversation';

COMMENT ON COLUMN conversations.takeover_at IS
'Timestamp when the conversation was taken over by a human';

COMMENT ON COLUMN conversations.last_agent_response_at IS
'Timestamp of the last response from the human agent. Used for auto-release after inactivity.';
