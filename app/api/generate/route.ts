import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { content, customPrompt, numSlides = 5 } = await req.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Kein Quelltext bereitgestellt." },
        { status: 400 }
      );
    }

    const systemPrompt = `
Du bist ein erstklassiger B2B-Social-Media-Ghostwriter und Content-Stratege.
Deine Aufgabe ist es, aus dem gegebenen Quelltext ein packendes Karussell (exakt ${numSlides} Folien) sowie einen passenden Begleittext (Post Copy) zu erstellen.

STRIKTE REGELN GEGEN TEXTÜBERLAUF UND WIEDERHOLUNG:
1. Erstelle GENAU ${numSlides} Folien.
2. Jede Folie MUSS einen eigenständigen, sequenziellen Schritt oder Gedanken darstellen. Wiederhole keinesfalls Thesen aus vorherigen Folien.
3. Wortbegrenzungen einhalten:
   - "headline": Maximal 6 bis 8 Wörter. Kurz, pointiert, stark formuliert.
   - "content": Maximal 25 bis 30 Wörter. Prägnante Sätze oder 2-3 knackige Bulletpoints. Kein Scrollen nötig!
4. Layout-Typen ("layoutType") passend zuordnen:
   - "cover": Für Folie 1 (starke Hook, riesige Headline, prägnanter Untertitel)
   - "bullets": Für Aufzählungen, Schritte oder Tipps (Headline oben, 2-3 knackige Punkte im Content)
   - "quote": Für Kernaussagen, Merksätze oder Zitate
   - "statement": Für fundierte Erklärungen oder Gedankenanstöße (Standard)
   - "cta": Für die letzte Folie (konkrete Handlungsaufforderung, Frage an die Community)

Antworte AUSSCHLIESSLICH im folgenden JSON-Format:
{
  "slides": [
    {
      "slideNumber": 1,
      "tag": "HOOK",
      "layoutType": "cover",
      "headline": "Prägnante Hook-Headline",
      "content": "Kurzer, neugierig machender Teaser-Text."
    }
  ],
  "postCopy": "Der fertige Social Media Begleittext mit Hook, Absätzen, Emojis und Call-to-Action."
}
`;

    const userMessage = `
Quelltext / Notizen:
"""
${content}
"""

${customPrompt ? `Zusätzliche Nutzer-Anweisungen:\n"""\n${customPrompt}\n"""` : ""}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Keine Antwort von OpenAI erhalten.");
    }

    const parsedData = JSON.parse(responseContent);

    return NextResponse.json({
      success: true,
      slides: parsedData.slides,
      postCopy: parsedData.postCopy,
    });
  } catch (error: any) {
    console.error("Fehler bei der Generierung:", error);
    return NextResponse.json(
      { error: error.message || "Interner Serverfehler" },
      { status: 500 }
    );
  }
}