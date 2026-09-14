import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { content, customPrompt, numSlides } = await req.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { success: false, error: "Quelltext fehlt oder ist ungültig." },
        { status: 400 }
      );
    }

    const slideCount = Math.min(Math.max(Number(numSlides) || 5, 1), 10);

    const systemPrompt = `
Du bist ein erstklassiger B2B-Social-Media-Ghostwriter und Carousel-Designer für LinkedIn und Instagram.
Deine Aufgabe ist es, den Quelltext in genau ${slideCount} logisch aufeinander aufbauende Karussell-Folien zu zerlegen und einen hochkonvertierenden Begleittext (Post Copy) zu verfassen.

WÄHLE FÜR JEDE FOLIE DAS OPTIMALE LAYOUT:
- "cover": Die klassische Einstiegs-Hook-Folie mit starkem Titel.
- "hero": Ein visuelles Cover oder emotionales Highlight mit vollflächigem Hintergrundbild.
- "statement": Eine prägnante Kernaussage mit kurzer Erklärung.
- "splitscreen": 50/50 Aufteilung aus Bild/Grafik-Fokus und präzisem Text.
- "bigstat": Für auffällige Kennzahlen, Prozentsätze, Multiplikatoren oder Statistiken. Benötigt das Feld "statNumber" (z. B. "+340%", "10x", "87%", "€1.2M").
- "step": Für Schritt-für-Schritt-Anleitungen, Frameworks und Phasen. Benötigt das Feld "stepBadge" (z. B. "SCHRITT 01", "PHASE 2").
- "bullets": Für Aufzählungen, Checklisten oder 3-4 Bulletpoints.
- "quote": Für Zitate oder prägende Leitsätze.
- "cta": Die finale Abschlussfolie mit klarer Handlungsaufforderung.

REGELN FÜR DIE STRUKTUR:
- Folie 1 MUSS "cover" oder "hero" sein.
- Die letzte Folie MUSS "cta" sein.
- Nutze "bigstat", sobald der Quelltext relevante Zahlen, ROI-Daten oder Prozente enthält.
- Nutze "step", wenn Anleitungen oder aufeinanderfolgende Tipps vorkommen.
- Texte kurz, direkt und auf den Punkt halten (keine Schachtelsätze).

ANTWORTE AUSSCHLIESSLICH IM FOLGENDEN JSON-FORMAT:
{
  "slides": [
    {
      "slideNumber": 1,
      "tag": "HOOK",
      "layoutType": "cover",
      "headline": "Knackige Überschrift",
      "content": "Teaser oder Erklärung",
      "statNumber": "+250%",
      "stepBadge": "SCHRITT 01"
    }
  ],
  "postCopy": "Vollständiger LinkedIn-Begleittext mit Hook, Absätzen, Aufzählungspunkten und Call to Action."
}
`;

    const userPrompt = `
Quelltext:
"""
${content}
"""

${customPrompt ? `Zusätzliche Benutzer-Anweisungen (Tonalität, Zielgruppe):\n"""${customPrompt}"""\n` : ""}

Erstelle jetzt das JSON mit genau ${slideCount} Folien und der Post Copy.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error("Keine Antwort von OpenAI erhalten.");
    }

    const parsed = JSON.parse(rawContent);

    return NextResponse.json({
      success: true,
      slides: parsed.slides || [],
      postCopy: parsed.postCopy || "",
    });
  } catch (error: any) {
    console.error("Fehler bei der Carousel-Generierung:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Interner Serverfehler." },
      { status: 500 }
    );
  }
}