import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { PrismaService } from '../../prisma/prisma.service';

interface ConversationContext {
  videoTitle: string;
  videoSummary: string;
  transcript: string;
  timeline: Array<{
    timestamp: string;
    title?: string;
    points?: Array<{ timestamp: string; content: string }>;
  }>;
  keywords: string[];
}

interface ChatHistory {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

@Injectable()
export class GeminiChatService {
  private readonly logger = new Logger(GeminiChatService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateResponse(
    sessionId: string,
    userMessage: string,
  ): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini API is not configured');
    }

    // Get session with messages and find the analysis context
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50, // Limit conversation history
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Find the analysis reference from the session's analysis_card message
    this.logger.log(`Session ${sessionId} has ${session.messages.length} messages`);
    this.logger.log(`Message types: ${session.messages.map((m) => m.type).join(', ')}`);

    // Find analysis_card message (with or without analysisRefId)
    const analysisCardMessage = session.messages.find((m) => m.type === 'analysis_card');

    this.logger.log(`Analysis card message found: ${analysisCardMessage ? 'Yes' : 'No'}`);

    let analysisRefId: string | null = null;

    if (analysisCardMessage) {
      // First try direct analysisRefId
      if (analysisCardMessage.analysisRefId) {
        analysisRefId = analysisCardMessage.analysisRefId;
        this.logger.log(`Direct AnalysisRefId found: ${analysisRefId}`);
      } else {
        // Fallback: Parse content JSON to get jobId, then lookup resultId from job
        try {
          const contentJson = JSON.parse(analysisCardMessage.content || '{}');
          const jobId = contentJson.jobId;
          const directResultId = contentJson.resultId;
          this.logger.log(`Parsed from content - jobId: ${jobId}, resultId: ${directResultId}`);

          if (directResultId) {
            // Use resultId directly if available in content
            analysisRefId = directResultId;
          } else if (jobId) {
            // Look up the job to get resultId
            const job = await this.prisma.analysisJob.findUnique({
              where: { id: jobId },
              select: { resultId: true },
            });
            if (job?.resultId) {
              analysisRefId = job.resultId;
              this.logger.log(`Found resultId from job lookup: ${analysisRefId}`);
            }
          }
        } catch (e) {
          this.logger.warn(`Failed to parse analysis card content: ${e}`);
        }
      }
    }

    let context: ConversationContext | null = null;

    if (analysisRefId) {
      const analysis = await this.prisma.analysisResult.findUnique({
        where: { id: analysisRefId },
      });

      if (analysis) {
        const resultJson = analysis.resultJson as {
          title?: string;
          summary?: string;
          timeline?: Array<{
            timestamp: string;
            title?: string;
            points?: Array<{ timestamp: string; content: string }>;
          }>;
          keywords?: string[];
        } | null;

        context = {
          videoTitle: analysis.videoTitle || resultJson?.title || 'Unknown Video',
          videoSummary: resultJson?.summary || '',
          transcript: analysis.transcript || '',
          timeline: resultJson?.timeline || [],
          keywords: resultJson?.keywords || [],
        };
      }
    }

    // Build system instruction
    const systemInstruction = this.buildSystemInstruction(context);

    this.logger.log(`Context found: ${context ? 'Yes' : 'No'}`);
    if (context) {
      this.logger.log(`Video: ${context.videoTitle}, Keywords: ${context.keywords.length}`);
    }

    // Build chat history (exclude the current message we just saved)
    const chatHistory: ChatHistory[] = session.messages
      .filter((m) => m.type === 'text' && m.content)
      .slice(-20) // Last 20 messages for context
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content! }],
      })) as ChatHistory[];

    // Create the model with system instruction
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    // Start chat with history
    const chat = model.startChat({
      history: chatHistory.slice(0, -1), // Exclude the current message
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    try {
      const result = await chat.sendMessage(userMessage);
      const response = result.response.text();

      return response;
    } catch (error) {
      this.logger.error(`Gemini API error: ${error}`);
      throw new Error('Failed to generate AI response');
    }
  }

  private buildSystemInstruction(context: ConversationContext | null): string {
    if (!context) {
      return `당신은 Glint의 AI 어시스턴트입니다. 사용자의 질문에 친절하고 도움이 되는 답변을 제공하세요.

현재 분석된 영상이 없습니다. 사용자가 YouTube URL을 입력하면 영상을 분석할 수 있습니다.`;
    }

    // Format timeline for context
    const timelineText = context.timeline
      .map((t) => {
        const points = t.points
          ?.map((p) => `  [${p.timestamp}] ${p.content}`)
          .join('\n');
        return `${t.timestamp} - ${t.title || 'Section'}${points ? '\n' + points : ''}`;
      })
      .join('\n\n');

    return `당신은 Glint의 AI 어시스턴트입니다. 사용자가 분석한 YouTube 영상에 대해 질문하면, 아래 영상 정보를 바탕으로 정확하고 도움이 되는 답변을 제공하세요.

## 분석된 영상 정보

**제목**: ${context.videoTitle}

**요약**: ${context.videoSummary}

**키워드**: ${context.keywords.join(', ')}

**타임라인 (챕터)**:
${timelineText}

**전체 트랜스크립트**:
${context.transcript.slice(0, 15000)}${context.transcript.length > 15000 ? '...(생략)' : ''}

## 답변 가이드라인

1. 영상 내용을 기반으로 정확하게 답변하세요
2. 관련 타임스탬프를 언급하여 사용자가 해당 부분을 찾을 수 있게 하세요
3. 마크다운 포맷(볼드, 리스트, 코드블록 등)을 사용하여 읽기 쉽게 작성하세요
4. 영상에서 다루지 않은 내용에 대해서는 솔직하게 "영상에서 다루지 않은 내용입니다"라고 답하세요
5. 한국어로 답변하세요 (영상이 영어여도 한국어로 설명)`;
  }
}
