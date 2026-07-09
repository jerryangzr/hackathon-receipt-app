import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { parseReceiptText } from "@/lib/receipt-parser";
import { createAnonServerSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function extensionFor(contentType: string) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return extensions[contentType] ?? "jpg";
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let bytes: ArrayBuffer;
    let imageType: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const image = formData.get("image") ?? formData.get("file");
      if (!(image instanceof File)) {
        return NextResponse.json(
          { success: false, error: 'Send an image in the "image" form field.' },
          { status: 400 },
        );
      }
      bytes = await image.arrayBuffer();
      imageType = image.type;
    } else {
      bytes = await request.arrayBuffer();
      imageType = contentType.split(";")[0];
    }

    if (!imageType.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Content-Type must be an image or multipart/form-data." },
        { status: 415 },
      );
    }
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image must be between 1 byte and 10 MB." },
        { status: 413 },
      );
    }

    const worker = await createWorker("eng");
    let rawText = "";
    try {
      const result = await worker.recognize(Buffer.from(bytes));
      rawText = result.data.text;
    } finally {
      await worker.terminate();
    }

    const supabase = createAnonServerSupabaseClient();
    const path = `api/${crypto.randomUUID()}.${extensionFor(imageType)}`;
    const { error: uploadError } = await supabase.storage
      .from("receipt-images")
      .upload(path, Buffer.from(bytes), { contentType: imageType, upsert: false });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("receipt-images").getPublicUrl(path);

    return NextResponse.json({
      success: true,
      receipt: parseReceiptText(rawText),
      image_url: data.publicUrl,
      requires_confirmation: true,
      message: "Image processed. Review and confirm the extracted data before creating a receipt.",
    });
  } catch (error) {
    console.error("Receipt API upload failed", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not process the image.",
      },
      { status: 500 },
    );
  }
}
