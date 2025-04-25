import { NextRequest, NextResponse } from "next/server";

import { AIProviderFactory } from "../../genai";

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const provider = AIProviderFactory.getProvider("openai");
    const prompt = `Search for books using the following parameters: ${JSON.stringify(params)}. Provide the results as a JSON array of book objects with fields: title, author, publicationDate, description, genres, rating, reviewCount, pageCount, imageUrl.`;
    const { recommendations } = await provider.getRecommendations(prompt);
    return NextResponse.json(recommendations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
