-- =============================================
-- Functions and Triggers
-- =============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_chat_sessions_updated BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_analysis_results_updated BEFORE UPDATE ON analysis_results FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_integration_notion_updated BEFORE UPDATE ON integration_notion FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_subscriptions_updated BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_system_prompts_updated BEFORE UPDATE ON system_prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_ad_configs_updated BEFORE UPDATE ON ad_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_ad_frequency_updated BEFORE UPDATE ON ad_frequency_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_daily_usage_updated BEFORE UPDATE ON daily_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_push_tokens_updated BEFORE UPDATE ON push_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- Create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 크레딧 차감 함수 (원자적 처리)
-- =============================================
CREATE OR REPLACE FUNCTION deduct_credits(
    p_user_id UUID,
    p_amount INT,
    p_description TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INT, message TEXT) AS $$
DECLARE
    v_current_balance INT;
    v_new_balance INT;
BEGIN
    SELECT credits INTO v_current_balance FROM profiles WHERE id = p_user_id FOR UPDATE;

    IF v_current_balance IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, 'USER_NOT_FOUND'::TEXT;
        RETURN;
    END IF;

    IF v_current_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, v_current_balance, 'CREDITS_INSUFFICIENT'::TEXT;
        RETURN;
    END IF;

    v_new_balance := v_current_balance - p_amount;
    UPDATE profiles SET credits = v_new_balance WHERE id = p_user_id;

    INSERT INTO credit_transactions (user_id, amount, type, description, reference_id, reference_type, balance_after)
    VALUES (p_user_id, -p_amount, 'USE', p_description, p_reference_id, p_reference_type, v_new_balance);

    RETURN QUERY SELECT TRUE, v_new_balance, 'SUCCESS'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 크레딧 환불 함수
-- =============================================
CREATE OR REPLACE FUNCTION refund_credits(
    p_user_id UUID,
    p_amount INT,
    p_description TEXT,
    p_reference_id UUID DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    v_new_balance INT;
BEGIN
    UPDATE profiles SET credits = credits + p_amount WHERE id = p_user_id RETURNING credits INTO v_new_balance;

    INSERT INTO credit_transactions (user_id, amount, type, description, reference_id, reference_type, balance_after)
    VALUES (p_user_id, p_amount, 'REFUND', p_description, p_reference_id, 'analysis_job', v_new_balance);

    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 리워드 광고 보상 지급 함수
-- =============================================
CREATE OR REPLACE FUNCTION grant_ad_reward(
    p_user_id UUID,
    p_reward_type TEXT,
    p_duration_hours INT DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
    v_access_id UUID;
BEGIN
    UPDATE temporary_premium_access SET is_active = FALSE WHERE user_id = p_user_id AND is_active = TRUE;

    INSERT INTO temporary_premium_access (user_id, expires_at, source)
    VALUES (p_user_id, NOW() + (p_duration_hours || ' hours')::INTERVAL, 'AD_REWARD')
    RETURNING id INTO v_access_id;

    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (p_user_id, 'AD_REWARD', 'temporary_premium_access', v_access_id,
            jsonb_build_object('reward_type', p_reward_type, 'duration_hours', p_duration_hours));

    RETURN v_access_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 광고 표시 여부 확인 함수
-- =============================================
CREATE OR REPLACE FUNCTION should_show_ads(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_plan TEXT;
    v_has_temp_premium BOOLEAN;
BEGIN
    SELECT plan INTO v_plan FROM profiles WHERE id = p_user_id;

    IF v_plan IN ('LIGHT', 'PRO', 'BUSINESS') THEN
        RETURN FALSE;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM temporary_premium_access
        WHERE user_id = p_user_id AND is_active = TRUE AND expires_at > NOW()
    ) INTO v_has_temp_premium;

    IF v_has_temp_premium THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 일일 사용량 증가 함수
-- =============================================
CREATE OR REPLACE FUNCTION increment_daily_usage(
    p_user_id UUID,
    p_type TEXT,
    p_video_minutes INT DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_usage (user_id, date, standard_analyses, deep_analyses, chat_messages, total_video_minutes)
    VALUES (p_user_id, CURRENT_DATE,
            CASE WHEN p_type = 'standard' THEN 1 ELSE 0 END,
            CASE WHEN p_type = 'deep' THEN 1 ELSE 0 END,
            CASE WHEN p_type = 'chat' THEN 1 ELSE 0 END,
            p_video_minutes)
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        standard_analyses = daily_usage.standard_analyses + CASE WHEN p_type = 'standard' THEN 1 ELSE 0 END,
        deep_analyses = daily_usage.deep_analyses + CASE WHEN p_type = 'deep' THEN 1 ELSE 0 END,
        chat_messages = daily_usage.chat_messages + CASE WHEN p_type = 'chat' THEN 1 ELSE 0 END,
        total_video_minutes = daily_usage.total_video_minutes + p_video_minutes,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 분석 제한 체크 함수
-- =============================================
CREATE OR REPLACE FUNCTION check_analysis_limits(
    p_user_id UUID,
    p_mode TEXT,
    p_video_duration_minutes INT
)
RETURNS TABLE(allowed BOOLEAN, reason TEXT) AS $$
DECLARE
    v_plan TEXT;
    v_today_usage RECORD;
    v_max_duration INT;
    v_daily_limit INT;
BEGIN
    SELECT plan INTO v_plan FROM profiles WHERE id = p_user_id;

    CASE v_plan
        WHEN 'FREE' THEN v_max_duration := 10; v_daily_limit := 3;
        WHEN 'LIGHT' THEN v_max_duration := 30; v_daily_limit := 20;
        WHEN 'PRO' THEN v_max_duration := 60; v_daily_limit := 50;
        WHEN 'BUSINESS' THEN v_max_duration := 120; v_daily_limit := 200;
        ELSE v_max_duration := 10; v_daily_limit := 3;
    END CASE;

    IF p_mode = 'DEEP' AND v_plan IN ('FREE', 'LIGHT') THEN
        RETURN QUERY SELECT FALSE, 'DEEP_MODE_UNAVAILABLE'::TEXT;
        RETURN;
    END IF;

    IF p_video_duration_minutes > v_max_duration THEN
        RETURN QUERY SELECT FALSE, 'VIDEO_TOO_LONG'::TEXT;
        RETURN;
    END IF;

    SELECT * INTO v_today_usage FROM daily_usage WHERE user_id = p_user_id AND date = CURRENT_DATE;

    IF v_today_usage IS NOT NULL THEN
        IF (v_today_usage.standard_analyses + v_today_usage.deep_analyses) >= v_daily_limit THEN
            RETURN QUERY SELECT FALSE, 'DAILY_LIMIT_REACHED'::TEXT;
            RETURN;
        END IF;
    END IF;

    RETURN QUERY SELECT TRUE, 'OK'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
