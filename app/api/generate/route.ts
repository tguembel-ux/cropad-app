import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, customPrompt, numSlides = 5 } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Bitte gib einen Text, Link-Inhalt oder Notizen ein." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY ist in .env.local nicht hinterlegt." },
        { status: 500 }
      );
    }

    // System-Prompt für strukturierte Folien-Zerlegung & LinkedIn Copy
    const systemPrompt = `
Du bist ein erstklassiger B2B-Content-Stratege und Experte für virale LinkedIn-Karussells und Social-Media-Posts.
Deine Aufgabe ist es, den bereitgestellten Quelltext in ein strukturiertes, prägnantes Karussell mit ca. ${numSlides} Folien zu zerlegen und einen conversion-starken Begleittext zu verfassen.

REGELN FÜR DIE FOLIEN:
- Folie 1 (Hook): Starke Headline, die Neugier weckt, plus ein kurzer Untertitel.
- Folien 2 bis ${numSlides - 1} (Content): Immer genau 1 Kernpunkt pro Folie. Klare Überschrift, maximal 2-3 kurze Sätze oder prägnante Bullet-Points.
- Letzte Folie (CTA): Call-to-Action (z.B. Folgen, Speichern, Kommentieren).

REGELN FÜR DEN BEGLEITTEXT (postCopy):
- Eine starke Hook-Zeile oben.
- 2-3 kurze Absätze zur Einordnung des Mehrwerts.
- Ein klarer Call-to-Action am Ende.
- 3-5 passende Hashtags.

ANTWORTFORMAT:
Antworte AUSSCHLIESSLICH im folgenden JSON-Format ohne Markdown-Codeblöcke:
{
  "slides": [
    {
      "slideNumber": 1,
      "tag": "HOOK",
      "headline": "Titel der Folie",
      "content": "Kompakter Inhaltstext der Folie..."
    }
  ],
  "postCopy": "Vollständiger LinkedIn-Post-Text..."
}
`;

    const userMessage = `
QUELLTEXT:
${content}

${customPrompt ? `ZUSÄTZLICHE NUTZER-WÜNSCHE:\n${customPrompt}` : ""}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error("Keine Antwort von OpenAI erhalten.");
    }

    const data = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      slides: data.slides,
      postCopy: data.postCopy,
    });
  } catch (error: any) {
    console.error("[CropAd API Generate] Fehler:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Fehler bei der Generierung der Inhalte." },
      { status: 500 }
    );
  }
}