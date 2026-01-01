-- =============================================
-- Fix handle_new_user trigger for OAuth users
-- =============================================
-- Google OAuth provides: full_name, name, picture, email
-- Kakao OAuth provides: name, picture, email
-- The trigger needs to handle both cases

-- Drop and recreate the function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_name TEXT;
    v_avatar TEXT;
BEGIN
    -- OAuth 사용자의 경우 full_name 또는 name 필드에서 이름 추출
    v_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',  -- Google OAuth
        NEW.raw_user_meta_data->>'name',       -- Kakao OAuth, 일반 회원가입
        NEW.raw_user_meta_data->>'given_name'  -- Google fallback
    );

    -- 아바타 URL 추출
    v_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'     -- Google OAuth
    );

    INSERT INTO profiles (id, email, name, avatar_url)
    VALUES (NEW.id, NEW.email, v_name, v_avatar);

    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- 이미 프로필이 존재하는 경우 (race condition 방지)
        RETURN NEW;
    WHEN OTHERS THEN
        -- 에러 로깅 후 계속 진행 (사용자 생성은 성공해야 함)
        RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거가 이미 존재하면 다시 생성하지 않음
-- (트리거 자체는 그대로, 함수만 업데이트됨)
