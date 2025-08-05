import { NextRequest, NextResponse } from "next/server";

import { AIProviderFactory } from "../../genai";

export async function GET(
  _req: NextRequest,
  { params }: { params: { bookId: string } },
) {
  try {
    const provider = AIProviderFactory.getProvider("openai");
    const prompt = `Get detailed information for the book with ID: ${params.bookId}. Provide the output as a JSON object with fields: title, author, publicationDate, description, genres, rating, reviewCount, pageCount, imageUrl.`;
    const { recommendations } = await provider.getRecommendations(prompt);
    const book = recommendations[0] || {};
    return NextResponse.json(book);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
