-- =============================================
-- Row Level Security Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_notion ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_frequency_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE temporary_premium_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- =============================================
-- User Policies
-- =============================================

-- profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- chat_sessions
CREATE POLICY "Users can manage own sessions" ON chat_sessions FOR ALL USING (auth.uid() = user_id);

-- chat_messages
CREATE POLICY "Users can manage own messages" ON chat_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid())
);

-- analysis_results (공개 읽기)
CREATE POLICY "Anyone can read analysis results" ON analysis_results FOR SELECT USING (true);
CREATE POLICY "Authenticated can create analysis" ON analysis_results FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Service role can update analysis" ON analysis_results FOR UPDATE USING (true);

-- analysis_jobs
CREATE POLICY "Users can view own jobs" ON analysis_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own jobs" ON analysis_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can update jobs" ON analysis_jobs FOR UPDATE USING (true);

-- integration_notion
CREATE POLICY "Users can manage own notion" ON integration_notion FOR ALL USING (auth.uid() = user_id);

-- notion_exports
CREATE POLICY "Users can manage own exports" ON notion_exports FOR ALL USING (auth.uid() = user_id);

-- subscriptions
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage subscriptions" ON subscriptions FOR ALL USING (true);

-- credit_transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage transactions" ON credit_transactions FOR ALL USING (true);

-- system_prompts (공개 읽기)
CREATE POLICY "Anyone can read active prompts" ON system_prompts FOR SELECT USING (is_active = true);

-- audit_logs (서비스 전용)
CREATE POLICY "Service role can manage audit logs" ON audit_logs FOR ALL USING (true);

-- webhook_events (서비스 전용)
CREATE POLICY "Service role can manage webhook events" ON webhook_events FOR ALL USING (true);

-- ad_configs (공개 읽기)
CREATE POLICY "Anyone can read ad configs" ON ad_configs FOR SELECT USING (true);

-- ad_frequency_configs (공개 읽기)
CREATE POLICY "Anyone can read ad frequency" ON ad_frequency_configs FOR SELECT USING (true);

-- ad_events
CREATE POLICY "Users can create ad events" ON ad_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can read ad events" ON ad_events FOR SELECT USING (true);

-- temporary_premium_access
CREATE POLICY "Users can view own premium access" ON temporary_premium_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage premium access" ON temporary_premium_access FOR ALL USING (true);

-- daily_usage
CREATE POLICY "Users can view own usage" ON daily_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage usage" ON daily_usage FOR ALL USING (true);

-- user_analytics
CREATE POLICY "Service role can manage analytics" ON user_analytics FOR ALL USING (true);

-- notifications
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- push_tokens
CREATE POLICY "Users can manage own push tokens" ON push_tokens FOR ALL USING (auth.uid() = user_id);

-- api_keys (서비스 전용)
CREATE POLICY "Service role can manage api keys" ON api_keys FOR ALL USING (true);

-- user_feedback
CREATE POLICY "Users can create feedback" ON user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can view own feedback" ON user_feedback FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- Admin Policies
-- =============================================
CREATE POLICY "Admins have full access to profiles" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

CREATE POLICY "Admins have full access to chat_sessions" ON chat_sessions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

CREATE POLICY "Admins have full access to system_prompts" ON system_prompts FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

CREATE POLICY "Admins have full access to ad_configs" ON ad_configs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

CREATE POLICY "Admins have full access to ad_frequency_configs" ON ad_frequency_configs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

CREATE POLICY "Admins have full access to user_feedback" ON user_feedback FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
