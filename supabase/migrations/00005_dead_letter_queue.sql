-- Create Dead Letter Queue table for permanently failed jobs
CREATE TABLE IF NOT EXISTS message_queue_dlq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  original_job_id UUID NOT NULL,
  payload JSONB NOT NULL,
  error TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  failed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Create indexes
CREATE INDEX idx_message_queue_dlq_organization ON message_queue_dlq(organization_id);
CREATE INDEX idx_message_queue_dlq_created_at ON message_queue_dlq(created_at);
CREATE INDEX idx_message_queue_dlq_failed_at ON message_queue_dlq(failed_at);

-- RLS policies
ALTER TABLE message_queue_dlq ENABLE ROW LEVEL SECURITY;

-- Only organization members can view their DLQ jobs
CREATE POLICY "Users can view DLQ jobs from their organization"
  ON message_queue_dlq FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = message_queue_dlq.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Only admins/owners can delete DLQ jobs
CREATE POLICY "Admins can delete DLQ jobs"
  ON message_queue_dlq FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = message_queue_dlq.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Add comment
COMMENT ON TABLE message_queue_dlq IS
'Dead Letter Queue for permanently failed message queue jobs that exceeded max retries';
