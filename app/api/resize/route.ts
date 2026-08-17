import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const AD_FORMATS = [
  { name: "Square (1:1)", width: 1080, height: 1080, key: "1_1" },
  { name: "Story / Reel (9:16)", width: 1080, height: 1920, key: "9_16" },
  { name: "Landscape / Banner (16:9)", width: 1200, height: 628, key: "16_9" },
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Kein Bild hochgeladen" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const resizedImages = await Promise.all(
      AD_FORMATS.map(async (format) => {
        // 1. Hintergrund erstellen: Bild füllt das Format aus und wird weichgezeichnet
        const background = await sharp(buffer)
          .resize(format.width, format.height, { fit: "cover" })
          .blur(25) // Schöner Blur-Effekt für die Ränder
          .toBuffer();

        // 2. Vordergrund erstellen: Originalbild komplett erhalten (nichts wird abgeschnitten!)
        const foreground = await sharp(buffer)
          .resize(format.width, format.height, {
            fit: "inside", // Garantiert 100% Sichtbarkeit des Originals
          })
          .toBuffer();

        // 3. Beide Ebenen übereinanderlegen
        const finalImageBuffer = await sharp(background)
          .composite([
            {
              input: foreground,
              gravity: "centre", // Perfekt mittig platziert
            },
          ])
          .toFormat("png")
          .toBuffer();

        const base64 = `data:image/png;base64,${finalImageBuffer.toString("base64")}`;

        return {
          name: format.name,
          key: format.key,
          width: format.width,
          height: format.height,
          url: base64,
        };
      })
    );

    return NextResponse.json({ success: true, images: resizedImages });
  } catch (error) {
    console.error("Fehler bei der Bildverarbeitung:", error);
    return NextResponse.json({ error: "Verarbeitung fehlgeschlagen" }, { status: 500 });
  }
}