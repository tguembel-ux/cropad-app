import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

const AD_FORMATS = [
  { name: "Feed / Post (1:1)", width: 1080, height: 1080, key: "1_1", desc: "Instagram & Facebook Feed" },
  { name: "Story / Reel (9:16)", width: 1080, height: 1920, key: "9_16", desc: "TikTok, Stories & Shorts" },
  { name: "Landscape Banner (16:9)", width: 1200, height: 628, key: "16_9", desc: "Google & Meta Banner" },
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const mode = (formData.get("mode") as string) || "blur";

    if (!file) {
      return NextResponse.json({ error: "Kein Bild hochgeladen" }, { status: 400 });
    }

    console.log(`[CropAd] Verarbeite Bild im Modus: ${mode}`);
    console.log(`[CropAd] FAL_KEY vorhanden: ${Boolean(process.env.FAL_KEY)}`);

    const buffer = Buffer.from(await file.arrayBuffer());

    const resizedImages = await Promise.all(
      AD_FORMATS.map(async (format) => {
        let finalImageBase64: string;

        if (mode === "outpaint") {
          if (!process.env.FAL_KEY) {
            throw new Error("FAL_KEY Umgebungsvariable fehlt in .env.local");
          }

          console.log(`[CropAd] Starte KI Outpainting für ${format.name}...`);

          // 1. Originalbild einpassen
          const insideBuffer = await sharp(buffer)
            .resize(format.width, format.height, { fit: "inside" })
            .toBuffer();

          // 2. Auf Zielgröße zentrieren
          const paddedImage = await sharp({
            create: {
              width: format.width,
              height: format.height,
              channels: 4,
              background: { r: 255, g: 255, b: 255, alpha: 1 },
            },
          })
            .composite([{ input: insideBuffer, gravity: "centre" }])
            .toFormat("png")
            .toBuffer();

          const base64Input = `data:image/png;base64,${paddedImage.toString("base64")}`;

          try {
            // Fal AI Aufruf
            const result: any = await fal.subscribe("fal-ai/flux-general/image-to-image", {
              input: {
                image_url: base64Input,
                prompt: "seamless background continuation, professional studio lighting, realistic environment extension, advertising photo",
                strength: 0.75,
              },
            });

            console.log(`[CropAd] KI Outpainting erfolgreich für ${format.name}`);
            finalImageBase64 = result.data.images[0].url;
          } catch (aiErr: any) {
            console.error(`[CropAd] Fehler bei Fal.ai für ${format.name}:`, aiErr?.message || aiErr);
            // Fallback auf Blur
            const bg = await sharp(buffer).resize(format.width, format.height, { fit: "cover" }).blur(30).toBuffer();
            const fg = await sharp(buffer).resize(format.width, format.height, { fit: "inside" }).toBuffer();
            const composite = await sharp(bg).composite([{ input: fg, gravity: "centre" }]).toFormat("png").toBuffer();
            finalImageBase64 = `data:image/png;base64,${composite.toString("base64")}`;
          }
        } else if (mode === "cover") {
          const cropped = await sharp(buffer)
            .resize({
              width: format.width,
              height: format.height,
              fit: "cover",
              position: "centre",
            })
            .toFormat("png")
            .toBuffer();
          finalImageBase64 = `data:image/png;base64,${cropped.toString("base64")}`;
        } else {
          const bg = await sharp(buffer).resize(format.width, format.height, { fit: "cover" }).blur(30).toBuffer();
          const fg = await sharp(buffer).resize(format.width, format.height, { fit: "inside" }).toBuffer();
          const composite = await sharp(bg).composite([{ input: fg, gravity: "centre" }]).toFormat("png").toBuffer();
          finalImageBase64 = `data:image/png;base64,${composite.toString("base64")}`;
        }

        return {
          name: format.name,
          key: format.key,
          desc: format.desc,
          width: format.width,
          height: format.height,
          url: finalImageBase64,
        };
      })
    );

    return NextResponse.json({ success: true, images: resizedImages });
  } catch (error: any) {
    console.error("[CropAd] Globaler Fehler:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Verarbeitung fehlgeschlagen" }, { status: 500 });
  }
}