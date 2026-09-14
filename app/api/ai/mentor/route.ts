import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { AI_MENTOR_SYSTEM_PROMPT } from "@/lib/ai/mentor-prompt"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      message,
      history = [],
      image,
      subject = "General",
      topic = "General",
    } = body

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured. Add it to .env.local and restart the server.",
        },
        { status: 500 }
      )
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    })

    const conversation = history
      .slice(-10)
      .map(
        (item: { role: string; content: string }) =>
          `${item.role === "user" ? "Student" : "AI Mentor"}: ${item.content}`
      )
      .join("\n\n")

    const prompt = `
Subject: ${subject}
Topic: ${topic}

Previous conversation:
${conversation || "No previous conversation."}

Student's latest message:
${message}

Act as the FolioLabs AI Mentor.

Follow the FolioLabs Mentor rules exactly.
MATH FORMATTING:

- Mathematical notation must use standard LaTeX.
- Inline mathematics MUST use $...$.
- Important standalone equations MUST use $$...$$.
- NEVER use square brackets [ ... ] to represent mathematical equations.
- NEVER use plain parentheses ( ... ) to represent mathematical equations.
- NEVER write LaTeX commands without math delimiters.
- Use proper LaTeX commands such as \frac{}, ^{}, _{}, \sqrt{}, \cdot, \sum, \int, \leq, and \geq.
- Keep equations concise and readable.
- Do not explain mathematical notation in words when standard notation is clearer.

Examples of CORRECT formatting:

The function is $f(x)=x^2$.

The power rule is:

$$
\frac{d}{dx}x^n = nx^{n-1}
$$

Ask the student what happens when $n=2$.

Examples of INCORRECT formatting:

[ f(x) = x^n ]

( x^2 )

[ \frac{d}{dx}x^n = nx^{n-1} ]
 
Do not give the final answer.
Give a useful hint.
Ask a guiding question.
Help the student reason toward the answer.

If the student asks you to simply give the answer, refuse and continue mentoring.
`

    const contents: any[] = [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ]

    if (image?.data && image?.mimeType) {
      contents[0].parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      })
    }

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction: AI_MENTOR_SYSTEM_PROMPT,
      },
    })

    const response = result.text

    if (!response) {
      throw new Error("Gemini returned an empty response.")
    }

    return NextResponse.json({
      response,
      recorded: true,
    })
  } catch (error) {
    console.error("FolioLabs AI Mentor error:", error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown Gemini API error.",
      },
      { status: 500 }
    )
  }
}