import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT =
  `You are a nutrition database. Given a food description, return ONLY a JSON object ` +
  `with no markdown: { foodName: string, calories: number, protein: number, carbs: number, fat: number, servingSize: string } ` +
  `Base values on a standard single serving. Be accurate and concise.`;

export async function POST(request: Request) {
  try {
    const { foodDescription } = await request.json();

    if (!foodDescription || typeof foodDescription !== "string") {
      return NextResponse.json(
        { error: "foodDescription is required" },
        { status: 400 }
      );
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: foodDescription }],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    const nutrition = JSON.parse(text);

    return NextResponse.json(nutrition);
  } catch (error) {
    console.error("Error in log-food route:", error);
    return NextResponse.json(
      { error: "Failed to analyze food" },
      { status: 500 }
    );
  }
}
