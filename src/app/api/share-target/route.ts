import { NextRequest, NextResponse } from "next/server";
import { createAnonServerSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File) || !IMAGE_EXTENSIONS[image.type]) {
      return NextResponse.json(
        { success: false, error: "Share a JPG, PNG, or WebP receipt image." },
        { status: 415 },
      );
    }
    if (image.size === 0 || image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "The shared image must be smaller than 10 MB." },
        { status: 413 },
      );
    }

    const path = `shared/${crypto.randomUUID()}.${IMAGE_EXTENSIONS[image.type]}`;
    const supabase = createAnonServerSupabaseClient();
    const { error } = await supabase.storage
      .from("receipt-images")
      .upload(path, image, { contentType: image.type, upsert: false });
    if (error) throw error;

    const redirectUrl = new URL("/upload", request.url);
    redirectUrl.searchParams.set("shared", path);
    return NextResponse.redirect(redirectUrl, 303);
  } catch (error) {
    console.error("Share target upload failed", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not import the shared image.",
      },
      { status: 500 },
    );
  }
}
