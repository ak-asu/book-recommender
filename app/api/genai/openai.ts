import OpenAI from "openai";

import { AIProvider, AIProviderOptions, RecommendationResponse } from "./base";

export class OpenAIProvider extends AIProvider {
  private client: OpenAI;

  constructor(options: AIProviderOptions) {
    super(options);
    this.client = new OpenAI({
      apiKey: options.apiKey || process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: false,
    });
  }

  async getRecommendations(prompt: string): Promise<RecommendationResponse> {
    try {
      const formattedPrompt = this.formatPrompt(prompt);
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a book recommendation assistant. Provide book recommendations based on the user's query and preferences.",
          },
          { role: "user", content: formattedPrompt },
        ],
        model: this.options.model || "gpt-3.5-turbo-1106",
        response_format: { type: "json_object" },
        max_tokens: this.options.maxTokens,
        temperature: this.options.temperature,
      });
      const responseContent = completion.choices[0].message.content;
      if (!responseContent) {
        throw new Error("Empty response from OpenAI");
      }
      return this.parseBookRecommendations(responseContent);
    } catch (error) {
      throw new Error(
        `OpenAI recommendation failed: ${(error as Error).message}`,
      );
    }
  }
}
