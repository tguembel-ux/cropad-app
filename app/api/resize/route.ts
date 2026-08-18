import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const AD_FORMATS = [
  { name: "Feed / Post (1:1)", width: 1080, height: 1080, key: "1_1", desc: "Instagram & Facebook Feed" },
  { name: "Story / Reel (9:16)", width: 1080, height: 1920, key: "9_16", desc: "TikTok, Stories & Shorts" },
  { name: "Landscape Banner (16:9)", width: 1200, height: 628, key: "16_9", desc: "Google & Meta Banner" },
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const mode = (formData.get("mode") as string) || "blur"; // "blur" oder "cover"

    if (!file) {
      return NextResponse.json({ error: "Kein Bild hochgeladen" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const resizedImages = await Promise.all(
      AD_FORMATS.map(async (format) => {
        let finalImageBuffer: Buffer;

        if (mode === "cover") {
          // Modus 1: Format voll ausfüllen (Smart Center Crop)
          finalImageBuffer = await sharp(buffer)
            .resize({
              width: format.width,
              height: format.height,
              fit: "cover",
              position: "centre",
            })
            .toFormat("png")
            .toBuffer();
        } else {
          // Modus 2: Original komplett erhalten + weichgezeichneter Hintergrund (Blur)
          const background = await sharp(buffer)
            .resize(format.width, format.height, { fit: "cover" })
            .blur(30)
            .toBuffer();

          const foreground = await sharp(buffer)
            .resize(format.width, format.height, { fit: "inside" })
            .toBuffer();

          finalImageBuffer = await sharp(background)
            .composite([{ input: foreground, gravity: "centre" }])
            .toFormat("png")
            .toBuffer();
        }

        const base64 = `data:image/png;base64,${finalImageBuffer.toString("base64")}`;

        return {
          name: format.name,
          key: format.key,
          desc: format.desc,
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