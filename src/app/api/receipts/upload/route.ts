import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { parseReceiptText } from "@/lib/receipt-parser";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  try {
    const apiToken = process.env.RECEIPTSNAP_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { success: false, error: "Shortcut uploads are not configured." },
        { status: 503 },
      );
    }
    if (request.headers.get("authorization") !== `Bearer ${apiToken}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 },
      );
    }

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

    if (!ALLOWED_IMAGE_TYPES.has(imageType)) {
      return NextResponse.json(
        { success: false, error: "Content-Type must be JPG, PNG, or WebP." },
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

    return NextResponse.json({
      success: true,
      receipt: parseReceiptText(rawText),
      requires_confirmation: true,
      persisted: false,
      message: "Image processed but not stored. Review and confirm the extracted data in ReceiptSnap.",
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
