import { NextResponse } from "next/server";

import { AIProviderFactory } from "../../genai";

export async function GET() {
  try {
    const provider = AIProviderFactory.getProvider("openai");
    const prompt = `List the top 10 most popular books. Provide the output as a JSON array of book objects with fields: title, author, publicationDate, description, genres, rating, reviewCount, pageCount, imageUrl.`;
    const { recommendations } = await provider.getRecommendations(prompt);
    return NextResponse.json(recommendations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
