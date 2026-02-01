import { createGateway } from '@ai-sdk/gateway';
import { generateText } from 'ai';
import { env } from './env';

// Configure the gateway with the API key from .env
export const gateway = createGateway({
    apiKey: env.AI_GATEWAY_API_KEY,
});

// We use Google Gemini 1.5 Flash via the gateway for optimal study material processing
export const aiModel = gateway.languageModel('google/gemini-1.5-flash');

export interface GeneratedFlashcard {
    front: string;
    back: string;
    hint?: string;
}

/**
 * Generates flashcards from the provided text content or file data.
 */
/**
 * Generates flashcards from the provided text content or file data.
 */
export async function generateFlashcardsFromAI(
    content: string,
    attachments?: { data: string; mimeType: string }[]
): Promise<GeneratedFlashcard[]> {
    try {
        const { text } = await generateText({
            model: aiModel,
            system: `You are an expert study assistant. 
      Generate high-quality, concise flashcards from the provided content or files. 
      Focus on key concepts, definitions, and important facts.
      Return ONLY a JSON array of objects with the following structure:
      [
        {
          "front": "The question or concept",
          "back": "The answer or definition",
          "hint": "Optional short hint (string or null)"
        }
      ]
      Do not include any other text, markdown blocks, or explanations. Just the raw JSON array.`,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: content },
                        ...(attachments || []).map(a => ({
                            type: 'file' as const,
                            data: a.data,
                            mediaType: a.mimeType,
                        })),
                    ],
                },
            ],
        });

        // Clean potential markdown formatting if the model still includes it
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
        const flashcards = JSON.parse(cleanedText);

        if (!Array.isArray(flashcards)) {
            throw new Error('AI response is not an array');
        }

        return flashcards.map(card => ({
            front: card.front || '',
            back: card.back || '',
            hint: card.hint || undefined,
        })).filter(card => card.front && card.back);
    } catch (error) {
        console.error('AI Generation Error:', error);
        throw error;
    }
}
