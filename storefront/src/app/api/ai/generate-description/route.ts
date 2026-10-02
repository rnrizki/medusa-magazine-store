import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { title, category } = await req.json()

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required for AI generation" },
        { status: 400 }
      )
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY

    // If Gemini API key is provided in environment, query Gemini API
    if (apiKey) {
      try {
        const prompt = `You are a world-class magazine editor-in-chief and copywriter.
Write a compelling, sophisticated, and engaging editorial description for a premium digital magazine issue.

Magazine Title: "${title}"
Category: "${category || "General / Lifestyle"}"

Respond ONLY with a valid JSON object matching this exact format:
{
  "description": "A stylish, engaging 2-paragraph editorial overview capturing the essence, depth, and theme of this issue.",
  "highlights": [
    "Feature Article 1: Captivating headline with short hook",
    "Feature Article 2: Captivating headline with short hook",
    "Feature Article 3: Captivating headline with short hook"
  ]
}`

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
              },
            }),
          }
        )

        if (res.ok) {
          const geminiData = await res.json()
          const text =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            const parsed = JSON.parse(text)
            return NextResponse.json(parsed)
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini API call failed, using intelligent editorial generator", geminiErr)
      }
    }

    // Intelligent Editorial Generator fallback (instant, works offline or without API key)
    const editorialSynopsis = generateEditorialFallback(title, category)
    return NextResponse.json(editorialSynopsis)
  } catch (error: any) {
    console.error("AI Generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate description: " + error.message },
      { status: 500 }
    )
  }
}

function generateEditorialFallback(title: string, category?: string) {
  const cleanCategory = category || "Culture & Ideas"

  const openers = [
    `Welcome to the latest digital edition of ${title}. In this landmark release, our editorial team brings you exclusive reporting, breathtaking high-resolution visual curation, and in-depth investigative profiles shaping the frontier of ${cleanCategory.toLowerCase()}.`,
    `Curated for discerning readers worldwide, ${title} explores the pivotal moments and cultural shifts transforming ${cleanCategory.toLowerCase()}. Every page is crafted with meticulous typography, immersive editorial essays, and unfiltered conversations.`,
    `Spanning visionary perspectives and groundbreaking features, ${title} sets a new standard for modern digital journalism. Designed specifically for high-definition mobile and tablet reading.`,
  ]

  const bodies = [
    `Inside, discover unprecedented behind-the-scenes access to industry visionaries, technical breakthroughs, and critical essays that question convention. Whether reading on a tablet or desktop, this edition delivers an unrivaled visual and intellectual experience.`,
    `From exclusive photo retrospectives to visionary think-pieces, this issue serves as your definitive guide to what lies ahead. Complete with interactive high-res spreads and comprehensive editorial commentary.`,
  ]

  const opener = openers[Math.floor(Math.random() * openers.length)]
  const body = bodies[Math.floor(Math.random() * bodies.length)]
  const fullDescription = `${opener}\n\n${body}`

  const highlights = [
    `Cover Story: The Definitive Breakdown of ${title.replace(/[-_#]/g, " ")}`,
    `Global Perspective: 30 Pages of Exclusive Studio & Field Photography`,
    `Critical Dialogue: Thought Leaders on the Future of ${cleanCategory}`,
  ]

  return {
    description: fullDescription,
    highlights,
  }
}
