-- =============================================
-- Glint Seed Data - Realistic Chat Demo
-- Run this after you have a user in the system
-- =============================================

-- NOTE: Replace 'YOUR_USER_ID' with your actual user UUID from profiles table
-- You can find it by running: SELECT id, email FROM profiles LIMIT 1;

-- =============================================
-- 1. Analysis Results (completed analyses)
-- =============================================

-- Analysis 1: Tech tutorial video
INSERT INTO analysis_results (
    id, video_id, video_url, video_title, video_thumbnail,
    video_duration_seconds, mode, result_json, transcript, created_at
) VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'Next.js 14 완벽 가이드 - App Router부터 Server Actions까지',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    1847,
    'STANDARD',
    '{
        "title": "Next.js 14 완벽 가이드",
        "summary": "이 영상은 Next.js 14의 새로운 기능들을 심층적으로 다룹니다. App Router의 동작 원리, Server Components와 Client Components의 차이점, 그리고 Server Actions를 활용한 폼 처리 방법을 설명합니다. 특히 캐싱 전략과 ISR(Incremental Static Regeneration)의 개선된 기능에 대해 자세히 알아봅니다.",
        "keyTakeaways": [
            "App Router는 파일 시스템 기반 라우팅으로 page.tsx, layout.tsx, loading.tsx 등의 특수 파일을 사용",
            "Server Components가 기본값이며, 클라이언트 상호작용이 필요할 때만 use client 지시어 사용",
            "Server Actions로 API 라우트 없이 직접 서버 함수 호출 가능",
            "Parallel Routes와 Intercepting Routes로 복잡한 UI 패턴 구현",
            "Metadata API로 SEO 최적화가 더욱 간편해짐"
        ],
        "timeline": [
            {"timestamp": "00:00", "title": "소개 및 개요", "summary": "Next.js 14의 주요 변경사항 소개"},
            {"timestamp": "03:45", "title": "App Router 기초", "summary": "파일 기반 라우팅 시스템 설명"},
            {"timestamp": "12:30", "title": "Server vs Client Components", "summary": "두 컴포넌트 타입의 차이와 사용 시점"},
            {"timestamp": "22:15", "title": "Server Actions 실습", "summary": "폼 제출과 데이터 뮤테이션 처리"},
            {"timestamp": "35:00", "title": "캐싱 전략", "summary": "revalidate, revalidatePath, revalidateTag 사용법"}
        ],
        "keywords": ["Next.js", "App Router", "Server Components", "Server Actions", "React", "웹개발"]
    }',
    '[00:00] 안녕하세요 오늘은 Next.js 14에 대해 알아보겠습니다
[00:05] 이번 버전에서는 정말 많은 변화가 있었는데요
[00:12] 특히 App Router가 안정화되면서 많은 분들이 사용하고 계십니다
[00:20] 오늘 영상에서는 App Router의 핵심 개념부터...',
    NOW() - INTERVAL '2 days'
) ON CONFLICT (video_id, mode) DO NOTHING;

-- Analysis 2: Productivity video
INSERT INTO analysis_results (
    id, video_id, video_url, video_title, video_thumbnail,
    video_duration_seconds, mode, result_json, transcript, created_at
) VALUES (
    'a2222222-2222-2222-2222-222222222222',
    'abc123xyz99',
    'https://www.youtube.com/watch?v=abc123xyz99',
    '개발자의 생산성을 10배 높이는 습관들',
    'https://img.youtube.com/vi/abc123xyz99/maxresdefault.jpg',
    956,
    'STANDARD',
    '{
        "title": "개발자 생산성 10배 향상 습관",
        "summary": "이 영상에서는 실리콘밸리 시니어 개발자들이 실천하는 생산성 향상 습관을 공유합니다. 딥워크 시간 확보, 코드 리뷰 효율화, 그리고 자동화 도구 활용법까지 실제 사례와 함께 설명합니다.",
        "keyTakeaways": [
            "매일 4시간의 방해받지 않는 딥워크 시간 확보가 핵심",
            "코드 리뷰는 200줄 이하로 나눠서 진행하면 품질 향상",
            "반복 작업은 무조건 자동화 - 3번 이상 하면 스크립트 작성",
            "회의는 25분 또는 50분으로 제한하고 아젠다 필수",
            "주간 회고로 병목 지점 파악 및 개선"
        ],
        "timeline": [
            {"timestamp": "00:00", "title": "인트로", "summary": "생산성의 중요성과 영상 개요"},
            {"timestamp": "02:30", "title": "딥워크 실천법", "summary": "집중 시간 확보 전략"},
            {"timestamp": "08:15", "title": "코드 리뷰 최적화", "summary": "효율적인 리뷰 프로세스"},
            {"timestamp": "12:00", "title": "자동화 마인드셋", "summary": "무엇을 자동화할 것인가"}
        ],
        "keywords": ["생산성", "개발자", "딥워크", "자동화", "코드리뷰", "시간관리"]
    }',
    '[00:00] 오늘은 생산성에 대해 이야기해볼게요
[00:08] 제가 실리콘밸리에서 일하면서 배운 것들인데요...',
    NOW() - INTERVAL '5 days'
) ON CONFLICT (video_id, mode) DO NOTHING;

-- Analysis 3: Design video
INSERT INTO analysis_results (
    id, video_id, video_url, video_title, video_thumbnail,
    video_duration_seconds, mode, result_json, transcript, created_at
) VALUES (
    'a3333333-3333-3333-3333-333333333333',
    'design789abc',
    'https://www.youtube.com/watch?v=design789abc',
    'UI/UX 디자인 시스템 구축하기 - Figma to Code',
    'https://img.youtube.com/vi/design789abc/maxresdefault.jpg',
    2134,
    'STANDARD',
    '{
        "title": "UI/UX 디자인 시스템 구축 가이드",
        "summary": "디자인 시스템을 처음부터 구축하는 과정을 다룹니다. Figma에서 컴포넌트를 설계하고, 이를 실제 React 코드로 변환하는 워크플로우를 배웁니다. 토큰 시스템, 컴포넌트 아키텍처, 문서화까지 실무에서 바로 적용 가능한 내용입니다.",
        "keyTakeaways": [
            "디자인 토큰(색상, 타이포, 스페이싱)을 먼저 정의하고 시작",
            "Atomic Design 패턴으로 컴포넌트 계층 구조화",
            "Figma Variables와 CSS Custom Properties 연동",
            "Storybook으로 컴포넌트 문서화 및 테스트",
            "디자이너-개발자 핸드오프 프로세스 자동화"
        ],
        "timeline": [
            {"timestamp": "00:00", "title": "디자인 시스템이란?", "summary": "개념과 필요성 설명"},
            {"timestamp": "05:20", "title": "토큰 시스템 설계", "summary": "색상, 타이포그래피, 스페이싱 정의"},
            {"timestamp": "15:45", "title": "컴포넌트 설계", "summary": "Button, Input, Card 등 기본 컴포넌트"},
            {"timestamp": "28:00", "title": "Figma to Code", "summary": "코드 변환 워크플로우"},
            {"timestamp": "32:15", "title": "문서화", "summary": "Storybook 활용법"}
        ],
        "keywords": ["디자인시스템", "Figma", "UI/UX", "React", "Storybook", "컴포넌트"]
    }',
    '[00:00] 디자인 시스템 많이들 들어보셨죠
[00:05] 오늘은 실제로 처음부터 구축하는 과정을 보여드릴게요...',
    NOW() - INTERVAL '1 day'
) ON CONFLICT (video_id, mode) DO NOTHING;

-- Analysis 4: Claude Code AI Agent Team
INSERT INTO analysis_results (
    id, video_id, video_url, video_title, video_thumbnail,
    video_duration_seconds, mode, result_json, transcript, created_at
) VALUES (
    'a4444444-4444-4444-4444-444444444444',
    'claudecd026',
    'https://www.youtube.com/watch?v=claudecd026',
    'Claude Code just Built me an AI Agent Team (Claude Code + Skills + MCP)',
    'https://img.youtube.com/vi/claudecd026/maxresdefault.jpg',
    1043,
    'STANDARD',
    '{
        "title": "Claude Code로 AI 에이전트 팀 구축하기",
        "summary": "Grace가 Claude Code를 활용해 마케팅 팀을 위한 멀티 에이전트 시스템을 구축하는 과정을 보여줍니다. 단순한 채팅 도구가 아닌, Skills와 MCP(Model Context Protocol)를 활용해 Content Strategist, Presentation Specialist, Data Analyst, Social Media Specialist 등 4개의 전문 에이전트를 만들고, 이들이 서로 협업하도록 오케스트레이션합니다.",
        "keyTakeaways": [
            "모든 에이전트는 마크다운 파일에 Role & Responsibilities, Knowledge, Skills & MCP Tools 3가지를 정의해야 함",
            "claude.md 파일이 프로젝트 시스템 프롬프트 역할을 하며 폴더 구조와 글로벌 규칙을 정의",
            "Skills는 재사용 가능한 인스트럭션 매뉴얼로, 공식 플러그인이나 커스텀으로 생성 가능",
            "MCP(Model Context Protocol)로 Notion, Ahrefs, GA4 등 외부 시스템과 실시간 연결",
            "Routing Rules를 claude.md에 추가하면 리드 Claude가 적절한 에이전트에게 작업을 자동 위임"
        ],
        "timeline": [
            {
                "timestamp": "00:00",
                "title": "소개 및 컨셉",
                "points": [
                    {"timestamp": "00:00", "content": "Grace는 처음에 Claude Code를 개발자 전용 도구로 여겼지만, 채팅만이 아닌 end-to-end AI 시스템 구축에 강력함을 깨달음"},
                    {"timestamp": "00:33", "content": "Claude Code의 장점: 일반 Claude Projects와 달리 에이전트들이 워크스페이스와 컨텍스트 파일을 공유하고 서로 대화 가능"},
                    {"timestamp": "01:10", "content": "핵심 컴포넌트: 모든 에이전트는 마크다운 파일에 Role & Responsibilities, Knowledge, Skills & MCP Tools를 정의"}
                ]
            },
            {
                "timestamp": "01:44",
                "title": "설치 및 설정",
                "points": [
                    {"timestamp": "01:44", "content": "4가지 접근 방법: Local Terminal(권장), IDE Extension, Claude Web App, Claude Desktop App"},
                    {"timestamp": "02:32", "content": "프로젝트 초기화: 로컬 폴더 생성, 비즈니스 컨텍스트 파일 포함, claude 명령어로 폴더 지정"},
                    {"timestamp": "03:06", "content": "claude.md 파일이 프로젝트 시스템 프롬프트 역할, 폴더 구조와 글로벌 규칙 정의"}
                ]
            },
            {
                "timestamp": "03:37",
                "title": "Agent 1: Content Strategist",
                "points": [
                    {"timestamp": "03:37", "content": "특별한 Skills나 MCP 도구 없이 컨텍스트만 사용하는 기본 에이전트"},
                    {"timestamp": "04:03", "content": "터미널(CLI)로 생성: /agents → Create new agent → Project level agent"},
                    {"timestamp": "05:15", "content": "템플릿 생성: Campaign Plan, Content Brief 등 필요한 템플릿을 templates 폴더에 저장"},
                    {"timestamp": "05:48", "content": "테스트: 채팅에서 에이전트를 태그하여 SEO 리서치 수행, 템플릿대로 종합 브리프 생성"}
                ]
            },
            {
                "timestamp": "07:16",
                "title": "Agent 2: Presentation Specialist",
                "points": [
                    {"timestamp": "07:16", "content": "Skills는 재사용 가능한 인스트럭션 매뉴얼, 공식 Document Creation Skills 사용"},
                    {"timestamp": "07:43", "content": "/plugin으로 공식 skills repository 등록 및 document-skills 설치"},
                    {"timestamp": "08:15", "content": "터미널로 에이전트 생성, 설치된 skills와 브랜드 컬러 팔레트 지정"},
                    {"timestamp": "08:35", "content": "테스트: 퍼포먼스 데이터 기반 10장 슬라이드 PPT 생성, 브랜드 컬러 적용된 차트 포함"}
                ]
            },
            {
                "timestamp": "09:22",
                "title": "Agent 3: Data Analyst",
                "points": [
                    {"timestamp": "09:27", "content": "MCP(Model Context Protocol): Claude가 외부 시스템(라이브 데이터)과 연결 가능하게 함"},
                    {"timestamp": "09:52", "content": "로컬 터미널에서 mcp add 명령어로 Notion, Ahrefs, GA4 설치"},
                    {"timestamp": "10:39", "content": "GA4 MCP를 사용하도록 Data Analyst 에이전트 구성"},
                    {"timestamp": "10:59", "content": "테스트: GA4로 실시간 데이터 가져와 트렌드 라인과 요약 포함된 인터랙티브 HTML 대시보드 생성"}
                ]
            },
            {
                "timestamp": "11:33",
                "title": "Agent 4: Social Media Specialist",
                "points": [
                    {"timestamp": "11:33", "content": "커스텀 Skills 생성: Branded Social Visuals 스킬"},
                    {"timestamp": "11:53", "content": "비주얼 예시 업로드 후 Claude에게 공식 Canvas Design 스킬을 확장하여 새 커스텀 스킬 생성 요청"},
                    {"timestamp": "12:42", "content": "테스트: 커스텀 스킬 + Notion MCP로 브랜드 비주얼 생성, Content Calendar에 날짜/태그 자동 등록"}
                ]
            },
            {
                "timestamp": "13:45",
                "title": "오케스트레이션",
                "points": [
                    {"timestamp": "13:59", "content": "Routing Rules: claude.md에 추가하여 리드 Claude가 적절한 에이전트에게 작업 위임"},
                    {"timestamp": "14:36", "content": "복합 워크플로우 테스트: 콘텐츠 리서치 → 블로그 포스트 → 프레젠테이션 덱"},
                    {"timestamp": "15:31", "content": "결과: 모든 에이전트가 같은 컨텍스트 공유, 수동 복사 없이 결과물 연결됨"}
                ]
            }
        ],
        "keywords": ["Claude Code", "AI Agent", "MCP", "Skills", "멀티에이전트", "Notion", "GA4", "마케팅 자동화"]
    }',
    'Introduction & Concept (00:00:00 – 00:01:43)
[00:00] Grace admits she initially dismissed Claude Code as a tool just for developers but realized it is powerful for building end-to-end AI systems, not just for chatting.

[00:33] Why Claude Code? unlike standard Claude "Projects" where agents are siloed, Claude Code agents share a workspace and context files. They can talk to each other, and Claude acts as the "Team Lead" to coordinate them.

[01:10] Core Components: Every agent needs three things defined in a markdown file:
- Role & Responsibilities.
- Knowledge (workflows/context).
- Skills & MCP Tools (Model Context Protocol).

Setup & Installation (00:01:44 – 00:03:36)
[01:44] 4 Ways to Access:
- Local Terminal: (Recommended) Raw method, best experience.
- IDE Extension: VS Code or Cursor.
- Claude Web App: Requires linking a GitHub repo.
- Claude Desktop App: Has Claude Code built-in.

[02:32] Project Initialization:
- Create a local folder (e.g., "Marketing Team").
- Include a business context file (brand info, goals).
- Use the claude command (or Desktop app) to target this folder.

[03:06] The claude.md File: The first step is asking Claude to read the business context and generate a claude.md file. This acts as the "Project System Prompt," defining the folder structure and global rules.

Agent 1: Content Strategist (Basic Agent) (00:03:37 – 00:06:21)
[03:37] This agent uses no special skills or MCP tools, just context.

[04:03] Creation Process: She uses the terminal (CLI) because the chat interface doesn''t fully support agent configuration yet.
Command: /agents -> Create new agent -> Project level agent.
Description: "Content Strategist that does web search and prepares content research docs."

[05:15] Templates: She asks Claude to generate necessary templates (Campaign Plan, Content Brief) and store them in a templates folder.

[05:48] Testing: She tags the agent in chat to research SEO challenges. The agent follows the created templates to produce a comprehensive brief.

Agent 2: Presentation Specialist (Using Skills) (00:07:16 – 00:09:21)
[07:16] Adding Skills: "Skills" are reusable instruction manuals. She uses the official Document Creation Skills.

[07:43] Installation: Uses /plugin to register the official skills repository and install document-skills.

[08:15] Configuration: Creates the agent via terminal, specifying it should use the installed skills and specific brand color palettes.

[08:35] Testing: Asks the agent to create a PowerPoint deck based on a performance dataset in the folder. The agent generates a 10-slide deck with charts using the brand colors.

Agent 3: Data Analyst (Using MCP Tools) (00:09:22 – 00:11:32)
[09:27] MCP (Model Context Protocol): Allows Claude to connect to external systems (live data).

[09:52] Installation: Uses the computer''s local terminal (not the embedded one) to run mcp add commands.
She installs: Notion, Ahrefs, and GA4 (Google Analytics).

[10:39] Configuration: Creates the Data Analyst agent configured to use the GA4 MCP tool.

[10:59] Testing: Asks the agent to analyze website performance. It pulls live data via GA4 and builds an interactive HTML dashboard with trend lines and summaries, which can be exported as a PDF.

Agent 4: Social Media Specialist (Custom Skills) (00:11:33 – 00:13:44)
[11:33] Custom Skills: Grace creates a "Branded Social Visuals" skill.

[11:53] Creation: She uploads visual examples and asks Claude to read the official "Canvas Design" skill and extend it to create a new custom skill for her brand.

[12:42] Testing: The Social Media agent uses this custom skill + the Notion MCP.
Task: Create post copy with visuals and schedule them.
Result: The agent generates on-brand visuals (simple but correct colors/logos) and adds the posts to the Notion Content Calendar with correct dates and tags.

Orchestration & Multi-Agent Workflow (00:13:45 – 00:16:48)
[13:59] Routing Rules: To make them work as a team, Grace asks Claude to update the claude.md file with "Routing Rules." This tells the lead Claude when to delegate tasks to which specific agent.

[14:36] The Big Test: She requests a complex workflow: Content Research -> Blog Post -> Presentation Deck.
- Lead Claude analyzes the request.
- Delegates to Content Strategist for web research.
- Passes findings to SEO Specialist (Agent 5, mentioned briefly) to write the blog using Ahrefs keywords.
- Passes content to Presentation Specialist to build the deck.

[15:31] Result: Claude presents a summary of all deliverables. The blog follows the brief, uses the research, and the deck aligns with the blog''s story. All agents shared the same context without manual copy-pasting.

Conclusion (00:16:49 – 00:17:23)
[16:49] Grace recaps the potential of using Claude Code for agentic workflows.
[17:00] Invites viewers to join her community for deep-dive workshops and prompt resources.',
    NOW()
) ON CONFLICT (video_id, mode) DO NOTHING;


-- =============================================
-- 2. Function to create seed data for a user
-- =============================================

CREATE OR REPLACE FUNCTION seed_demo_data(p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_session1_id UUID := gen_random_uuid();
    v_session2_id UUID := gen_random_uuid();
    v_session3_id UUID := gen_random_uuid();
    v_session4_id UUID := gen_random_uuid();
    v_job1_id UUID := gen_random_uuid();
    v_job2_id UUID := gen_random_uuid();
    v_job3_id UUID := gen_random_uuid();
    v_job4_id UUID := gen_random_uuid();
BEGIN
    -- =============================================
    -- Session 1: Next.js Tutorial Analysis
    -- =============================================
    INSERT INTO chat_sessions (id, user_id, title, created_at)
    VALUES (v_session1_id, p_user_id, 'Next.js 14 학습', NOW() - INTERVAL '2 days');

    -- User message
    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session1_id, 'user', 'text', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', NOW() - INTERVAL '2 days');

    -- Analysis job (completed)
    INSERT INTO analysis_jobs (id, user_id, session_id, video_url, video_id, mode, status, credits_reserved, result_id, progress, started_at, completed_at, created_at)
    VALUES (v_job1_id, p_user_id, v_session1_id, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'STANDARD', 'COMPLETED', 1, 'a1111111-1111-1111-1111-111111111111', 100, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '45 seconds', NOW() - INTERVAL '2 days');

    -- Assistant message with analysis card
    INSERT INTO chat_messages (session_id, role, type, content, analysis_ref_id, created_at)
    VALUES (v_session1_id, 'assistant', 'analysis_card', '{"jobId": "' || v_job1_id || '", "videoId": "dQw4w9WgXcQ", "status": "COMPLETED"}', 'a1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days' + INTERVAL '1 minute');

    -- Follow-up conversation
    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session1_id, 'user', 'text', 'Server Actions가 뭔지 더 자세히 설명해줄 수 있어?', NOW() - INTERVAL '2 days' + INTERVAL '5 minutes');

    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session1_id, 'assistant', 'text', 'Server Actions는 Next.js 14에서 도입된 기능으로, 클라이언트에서 직접 서버 함수를 호출할 수 있게 해줍니다.

**주요 특징:**
1. **API 라우트 불필요**: 별도의 `/api` 엔드포인트 없이 서버 로직 실행
2. **폼 처리 간소화**: `<form action={serverAction}>`으로 바로 연결
3. **Progressive Enhancement**: JavaScript 없이도 동작

**예시 코드:**
```typescript
''use server''

export async function createPost(formData: FormData) {
  const title = formData.get(''title'')
  await db.post.create({ data: { title } })
  revalidatePath(''/posts'')
}
```

영상의 22:15 타임스탬프에서 더 자세한 실습 예제를 확인할 수 있어요!', NOW() - INTERVAL '2 days' + INTERVAL '6 minutes');

    -- =============================================
    -- Session 2: Productivity Tips
    -- =============================================
    INSERT INTO chat_sessions (id, user_id, title, created_at)
    VALUES (v_session2_id, p_user_id, '생산성 향상 팁', NOW() - INTERVAL '5 days');

    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session2_id, 'user', 'text', 'https://www.youtube.com/watch?v=abc123xyz99', NOW() - INTERVAL '5 days');

    INSERT INTO analysis_jobs (id, user_id, session_id, video_url, video_id, mode, status, credits_reserved, result_id, progress, started_at, completed_at, created_at)
    VALUES (v_job2_id, p_user_id, v_session2_id, 'https://www.youtube.com/watch?v=abc123xyz99', 'abc123xyz99', 'STANDARD', 'COMPLETED', 1, 'a2222222-2222-2222-2222-222222222222', 100, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '30 seconds', NOW() - INTERVAL '5 days');

    INSERT INTO chat_messages (session_id, role, type, content, analysis_ref_id, created_at)
    VALUES (v_session2_id, 'assistant', 'analysis_card', '{"jobId": "' || v_job2_id || '", "videoId": "abc123xyz99", "status": "COMPLETED"}', 'a2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '5 days' + INTERVAL '1 minute');

    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session2_id, 'user', 'text', '딥워크 시간을 어떻게 확보하면 좋을까?', NOW() - INTERVAL '5 days' + INTERVAL '3 minutes');

    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session2_id, 'assistant', 'text', '영상에서 제안하는 딥워크 시간 확보 전략을 정리해드릴게요:

**1. 시간 블로킹**
- 캘린더에 "딥워크" 시간을 미리 예약
- 오전 9-12시가 가장 효과적 (인지 능력 피크)

**2. 환경 설정**
- 슬랙/이메일 알림 끄기
- 휴대폰 다른 방에 두기
- 헤드폰 착용으로 신호 보내기

**3. 팀 문화 만들기**
- "방해 금지 시간" 팀 협의
- 긴급 연락은 전화로만

**4. 점진적 확장**
- 처음엔 25분 → 점차 4시간까지 늘리기

특히 영상의 02:30 부분에서 실제 적용 사례를 보여주니 참고하세요!', NOW() - INTERVAL '5 days' + INTERVAL '4 minutes');

    -- =============================================
    -- Session 3: Design System (Recent)
    -- =============================================
    INSERT INTO chat_sessions (id, user_id, title, created_at)
    VALUES (v_session3_id, p_user_id, '디자인 시스템 구축', NOW() - INTERVAL '1 day');

    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session3_id, 'user', 'text', 'https://www.youtube.com/watch?v=design789abc', NOW() - INTERVAL '1 day');

    INSERT INTO analysis_jobs (id, user_id, session_id, video_url, video_id, mode, status, credits_reserved, result_id, progress, started_at, completed_at, created_at)
    VALUES (v_job3_id, p_user_id, v_session3_id, 'https://www.youtube.com/watch?v=design789abc', 'design789abc', 'STANDARD', 'COMPLETED', 1, 'a3333333-3333-3333-3333-333333333333', 100, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '50 seconds', NOW() - INTERVAL '1 day');

    INSERT INTO chat_messages (session_id, role, type, content, analysis_ref_id, created_at)
    VALUES (v_session3_id, 'assistant', 'analysis_card', '{"jobId": "' || v_job3_id || '", "videoId": "design789abc", "status": "COMPLETED"}', 'a3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '1 day' + INTERVAL '1 minute');

    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session3_id, 'user', 'text', '토큰 시스템을 구축할 때 가장 중요한 포인트가 뭐야?', NOW() - INTERVAL '1 day' + INTERVAL '10 minutes');

    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session3_id, 'assistant', 'text', '영상에서 강조하는 토큰 시스템 핵심 포인트입니다:

**1. 시맨틱 토큰 우선**
```css
/* Primitive tokens (raw values) */
--color-blue-500: #3B82F6;

/* Semantic tokens (meaning) */
--color-primary: var(--color-blue-500);
--color-text-link: var(--color-primary);
```

**2. 계층 구조 설계**
- Primitive → Semantic → Component 3단계
- 다크모드 전환이 쉬워짐

**3. 일관된 네이밍 컨벤션**
- `{category}-{property}-{variant}-{state}`
- 예: `color-background-surface-hover`

**4. 문서화 필수**
- 각 토큰의 사용처와 이유 기록
- Figma Variables와 1:1 매핑

영상 05:20부터 자세한 설계 과정이 나옵니다!', NOW() - INTERVAL '1 day' + INTERVAL '11 minutes');

    -- =============================================
    -- Session 4: Claude Code AI Agent Team (Today)
    -- =============================================
    INSERT INTO chat_sessions (id, user_id, title, created_at)
    VALUES (v_session4_id, p_user_id, 'Claude Code AI Agent Team', NOW());

    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session4_id, 'user', 'text', 'https://www.youtube.com/watch?v=claudecd026', NOW());

    INSERT INTO analysis_jobs (id, user_id, session_id, video_url, video_id, mode, status, credits_reserved, result_id, progress, started_at, completed_at, created_at)
    VALUES (v_job4_id, p_user_id, v_session4_id, 'https://www.youtube.com/watch?v=claudecd026', 'claudecd026', 'STANDARD', 'COMPLETED', 1, 'a4444444-4444-4444-4444-444444444444', 100, NOW(), NOW() + INTERVAL '40 seconds', NOW());

    INSERT INTO chat_messages (session_id, role, type, content, analysis_ref_id, created_at)
    VALUES (v_session4_id, 'assistant', 'analysis_card', '{"jobId": "' || v_job4_id || '", "videoId": "claudecd026", "status": "COMPLETED"}', 'a4444444-4444-4444-4444-444444444444', NOW() + INTERVAL '1 minute');

    -- Q1: MCP 설명
    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session4_id, 'user', 'text', 'MCP가 뭐야? 어떻게 설치해?', NOW() + INTERVAL '3 minutes');

    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session4_id, 'assistant', 'text', '영상에서 설명하는 MCP(Model Context Protocol)에 대해 정리해드릴게요!

**MCP란?**
Claude가 외부 시스템(라이브 데이터)과 연결할 수 있게 해주는 프로토콜입니다. 영상에서는 Notion, Ahrefs, GA4(Google Analytics)를 연동했어요.

**설치 방법 (09:52)**
로컬 터미널(Claude Code 내장 터미널이 아닌 컴퓨터 기본 터미널)에서 실행:

```bash
mcp add notion
mcp add ahrefs
mcp add ga4
```

**활용 예시**
영상 10:59에서 Data Analyst 에이전트가 GA4 MCP를 사용해:
- 웹사이트 성능 데이터를 실시간으로 가져오고
- 트렌드 라인과 요약이 포함된 인터랙티브 HTML 대시보드 생성
- PDF로 내보내기까지 자동화했어요!', NOW() + INTERVAL '4 minutes');

    -- Q2: Routing Rules
    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session4_id, 'user', 'text', '에이전트끼리 어떻게 협업해? Routing Rules가 뭔지 설명해줘', NOW() + INTERVAL '6 minutes');

    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session4_id, 'assistant', 'text', '**Routing Rules로 멀티 에이전트 협업 구현하기** (13:59)

영상에서 Grace가 설명한 오케스트레이션 방식입니다:

**1. claude.md에 Routing Rules 추가**
리드 Claude가 언제 어떤 에이전트에게 작업을 위임할지 정의합니다.

**2. 실제 테스트 워크플로우** (14:36)
복잡한 요청: "콘텐츠 리서치 → 블로그 포스트 → 프레젠테이션 덱"

```
1. Lead Claude가 요청을 분석
2. Content Strategist에게 웹 리서치 위임
3. SEO Specialist에게 Ahrefs 키워드로 블로그 작성 위임
4. Presentation Specialist에게 덱 생성 위임
```

**핵심 포인트**
- 모든 에이전트가 **같은 컨텍스트를 공유**
- 수동 복사/붙여넣기 없이 결과물이 연결됨
- 블로그가 리서치를 따르고, 덱이 블로그 스토리와 정렬됨

영상 15:31에서 최종 결과물 요약을 확인할 수 있어요!', NOW() + INTERVAL '7 minutes');

    -- Q3: Custom Skills
    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session4_id, 'user', 'text', '커스텀 스킬은 어떻게 만들어?', NOW() + INTERVAL '9 minutes');

    INSERT INTO chat_messages (session_id, role, type, content, created_at)
    VALUES (v_session4_id, 'assistant', 'text', '**커스텀 Skills 만들기** (11:33 - 11:53)

영상에서 Grace가 "Branded Social Visuals" 스킬을 만든 과정입니다:

**Step 1: 비주얼 예시 업로드**
브랜드에 맞는 이미지 샘플들을 폴더에 준비

**Step 2: 공식 스킬 참조**
Claude에게 요청:
> "공식 Canvas Design 스킬을 읽고, 우리 브랜드에 맞게 확장해서 새 커스텀 스킬을 만들어줘"

**Step 3: 에이전트에 적용**
Social Media Specialist 에이전트가 이 커스텀 스킬 + Notion MCP를 사용

**결과** (12:42)
- 에이전트가 브랜드 색상/로고가 적용된 비주얼 생성
- Notion Content Calendar에 날짜와 태그까지 자동 등록

**공식 Skills vs 커스텀 Skills**
| 구분 | 예시 | 설치 |
|------|------|------|
| 공식 | Document Creation Skills | `/plugin`으로 설치 |
| 커스텀 | Branded Social Visuals | 직접 정의 |

영상 07:43에서 공식 스킬 설치 방법도 확인해보세요!', NOW() + INTERVAL '10 minutes');

    RAISE NOTICE 'Demo data created successfully for user %', p_user_id;
END;
$$ LANGUAGE plpgsql;


-- =============================================
-- Usage Instructions
-- =============================================
--
-- 1. First, find your user ID:
--    SELECT id, email FROM profiles LIMIT 5;
--
-- 2. Then run the seed function:
--    SELECT seed_demo_data('your-user-uuid-here');
--
-- 3. To clean up demo data:
--    DELETE FROM chat_sessions WHERE title IN ('Next.js 14 학습', '생산성 향상 팁', '디자인 시스템 구축', 'Claude Code AI Agent Team');
--    DELETE FROM analysis_results WHERE video_id IN ('dQw4w9WgXcQ', 'abc123xyz99', 'design789abc', 'claudecd026');
--
