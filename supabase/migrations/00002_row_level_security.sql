-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organizations
CREATE OR REPLACE FUNCTION user_organizations(user_id UUID)
RETURNS SETOF UUID AS $$
  SELECT organization_id
  FROM organization_members
  WHERE organization_members.user_id = user_organizations.user_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT user_organizations(auth.uid())));

CREATE POLICY "Users can update their organizations if they are owners"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users policies
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "New users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Organization members policies
CREATE POLICY "Users can view members of their organizations"
  ON organization_members FOR SELECT
  USING (organization_id IN (SELECT user_organizations(auth.uid())));

CREATE POLICY "Owners and admins can add members"
  ON organization_members FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update members"
  ON organization_members FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can remove members"
  ON organization_members FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Channels policies
CREATE POLICY "Users can view channels in their organizations"
  ON channels FOR SELECT
  USING (organization_id IN (SELECT user_organizations(auth.uid())));

CREATE POLICY "Admins and owners can create channels"
  ON channels FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins and owners can update channels"
  ON channels FOR UPDATE
  USING (organization_id IN (SELECT user_organizations(auth.uid())))
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins and owners can delete channels"
  ON channels FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Conversations policies
CREATE POLICY "Users can view conversations in their organizations"
  ON conversations FOR SELECT
  USING (organization_id IN (SELECT user_organizations(auth.uid())));

CREATE POLICY "System can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (organization_id IN (SELECT user_organizations(auth.uid())));

CREATE POLICY "Users can update conversations in their organizations"
  ON conversations FOR UPDATE
  USING (organization_id IN (SELECT user_organizations(auth.uid())));

CREATE POLICY "Admins can delete conversations"
  ON conversations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages in their organization's conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE organization_id IN (SELECT user_organizations(auth.uid()))
    )
  );

CREATE POLICY "System can create messages"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE organization_id IN (SELECT user_organizations(auth.uid()))
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (sent_by = auth.uid());

-- Bot flows policies
CREATE POLICY "Users can view bot flows in their organizations"
  ON bot_flows FOR SELECT
  USING (organization_id IN (SELECT user_organizations(auth.uid())));

CREATE POLICY "Admins and owners can create bot flows"
  ON bot_flows FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins and owners can update bot flows"
  ON bot_flows FOR UPDATE
  USING (organization_id IN (SELECT user_organizations(auth.uid())))
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins and owners can delete bot flows"
  ON bot_flows FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Message queue policies (service role only)
CREATE POLICY "Service role can manage message queue"
  ON message_queue FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Comments for documentation
COMMENT ON POLICY "Users can view their organizations" ON organizations IS
  'Users can only see organizations they are members of';

COMMENT ON POLICY "Service role can manage message queue" ON message_queue IS
  'Only service role (backend) can manage the message queue for security';
