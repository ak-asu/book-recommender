import { AIProviderOptions, AIProvider } from "./base";
import { OpenAIProvider } from "./openai";

export class AIProviderFactory {
  static getProvider(
    type: "openai" | "gemini" = "openai",
    options: AIProviderOptions = {},
  ): AIProvider {
    switch (type) {
      case "openai":
        return new OpenAIProvider(options);
      default:
        return new OpenAIProvider(options);
    }
  }
}
