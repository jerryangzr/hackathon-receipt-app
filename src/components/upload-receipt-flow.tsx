"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Worker } from "tesseract.js";
import {
  ArrowLeft,
  Camera,
  Check,
  FileImage,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  parseReceiptText,
  RECEIPT_CATEGORIES,
  type ReceiptDraft,
} from "@/lib/receipt-parser";
import { saveLocalReceipt } from "@/lib/local-receipts";
import { createAuthenticatedBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Step = "pick" | "scan" | "confirm" | "saved";

const emptyDraft: ReceiptDraft = {
  vendor: "",
  date: "",
  total: 0,
  category: "Other",
  items: [],
};

export function UploadReceiptFlow() {
  const [step, setStep] = useState<Step>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const [draft, setDraft] = useState<ReceiptDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const scanGeneration = useRef(0);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    return () => {
      scanGeneration.current += 1;
      void workerRef.current?.terminate();
    };
  }, []);

  const scanReceipt = useCallback(async (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("The image must be smaller than 10 MB.");
      return;
    }

    let imageFile = selectedFile;
    const isHeic =
      /image\/hei[cf]/i.test(selectedFile.type) ||
      /\.hei[cf]$/i.test(selectedFile.name);
    if (isHeic) {
      setStep("scan");
      setProgress(2);
      try {
        const { default: heic2any } = await import("heic2any");
        const converted = await heic2any({
          blob: selectedFile,
          toType: "image/jpeg",
          quality: 0.9,
        });
        const jpeg = Array.isArray(converted) ? converted[0] : converted;
        imageFile = new File([jpeg], `${selectedFile.name.replace(/\.hei[cf]$/i, "")}.jpg`, {
          type: "image/jpeg",
        });
      } catch (error) {
        console.error(error);
        setStep("pick");
        toast.error("This HEIC photo could not be converted. Try a screenshot or JPG.");
        return;
      }
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) {
      toast.error("Choose a JPG, PNG, WebP, or HEIC image.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    const generation = ++scanGeneration.current;
    if (workerRef.current) await workerRef.current.terminate();
    setFile(imageFile);
    setPreview(URL.createObjectURL(imageFile));
    setStep("scan");
    setProgress(4);

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (message) => {
          if (generation === scanGeneration.current && message.status === "recognizing text") {
            setProgress(Math.max(8, Math.round(message.progress * 100)));
          }
        },
      });
      workerRef.current = worker;
      const result = await worker.recognize(imageFile);
      await worker.terminate();
      workerRef.current = null;
      if (generation !== scanGeneration.current) return;
      setDraft(parseReceiptText(result.data.text));
      setProgress(100);
      setStep("confirm");
    } catch (error) {
      if (generation !== scanGeneration.current) return;
      console.error(error);
      setDraft(emptyDraft);
      setStep("confirm");
      toast.error("OCR could not read this image. You can still enter the details manually.");
    }
  }, [preview]);

  async function saveReceipt() {
    if (
      !file ||
      !draft.vendor.trim() ||
      !draft.date ||
      !Number.isFinite(draft.total) ||
      draft.total < 0
    ) {
      toast.error("Add a vendor, valid date, and total before saving.");
      return;
    }
    if (draft.items.some((item) => !Number.isFinite(item.price) || item.price < 0)) {
      toast.error("Make sure every line item has a valid, non-negative price.");
      return;
    }

    if (!hasSupabaseConfig()) {
      try {
        saveLocalReceipt({
          ...draft,
          items: draft.items
            .filter((item) => item.name.trim())
            .map((item) => ({ name: item.name.trim(), price: item.price })),
        });
        setStep("saved");
        toast.success("Receipt saved privately on this device");
      } catch {
        toast.error("This browser could not store another receipt. Free some site storage and try again.");
      }
      return;
    }

    setSaving(true);
    let uploadedPath: string | null = null;
    try {
      const { supabase, user } = await createAuthenticatedBrowserClient();
      const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      uploadedPath = `${user.id}/web/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("receipt-images")
        .upload(uploadedPath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("receipts").insert({
        user_id: user.id,
        vendor: draft.vendor.trim(),
        date: draft.date,
        total: draft.total,
        category: draft.category,
        items: draft.items.filter((item) => item.name.trim()).map((item) => ({
          name: item.name.trim(),
          price: item.price,
        })),
        image_url: uploadedPath,
      });
      if (insertError) {
        await supabase.storage.from("receipt-images").remove([uploadedPath]);
        throw insertError;
      }

      setStep("saved");
      toast.success("Receipt saved");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not save the receipt.");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    scanGeneration.current += 1;
    void workerRef.current?.terminate();
    workerRef.current = null;
    if (preview) URL.revokeObjectURL(preview);
    setStep("pick");
    setFile(null);
    setPreview("");
    setProgress(0);
    setDraft(emptyDraft);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  if (step === "saved") {
    return (
      <Card className="mx-auto max-w-xl overflow-hidden border-0 bg-white py-0 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
        <CardContent className="flex flex-col items-center px-6 py-16 text-center sm:px-12">
          <div className="mb-6 grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_36px_rgba(47,205,112,0.3)]">
            <Check className="size-9" strokeWidth={2.5} />
          </div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-primary">
            <Sparkles className="size-4" /> Logged and draw-ready
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Receipt saved</h1>
          <p className="mt-3 max-w-sm text-muted-foreground">
            Your purchase is organized and now has a spot in the next Weekly Draw.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
            <Button onClick={reset} variant="outline" size="lg" className="h-12 flex-1 rounded-full">
              Scan another
            </Button>
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ size: "lg" }), "h-12 flex-1 rounded-full")}
            >
              View dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "scan") {
    return (
      <Card className="mx-auto max-w-xl border-0 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
        <CardContent className="px-6 py-12 sm:px-12">
          <div className="relative mx-auto mb-10 aspect-[4/5] w-48 overflow-hidden rounded-3xl bg-zinc-100 shadow-xl">
            {preview && <Image src={preview} alt="Receipt preview" fill unoptimized className="object-cover opacity-70" />}
            <div className="scan-line absolute inset-x-3 top-1/2 h-0.5 bg-primary shadow-[0_0_18px_5px_rgba(47,205,112,0.5)]" />
          </div>
          <div className="text-center">
            <LoaderCircle className="mx-auto mb-4 size-6 animate-spin text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Reading your receipt</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              OCR runs privately in your browser. Nothing saves yet.
            </p>
          </div>
          <Progress value={progress} className="mt-8 h-2" />
          <p className="mt-2 text-right text-xs tabular-nums text-muted-foreground">{progress}%</p>
        </CardContent>
      </Card>
    );
  }

  if (step === "confirm") {
    return (
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={reset}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Choose another image
        </button>
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">Review before saving</p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Does everything look right?</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Nothing is saved until you confirm
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="h-fit overflow-hidden border-0 bg-zinc-900 py-0 shadow-sm">
            <div className="relative aspect-[4/5]">
              {preview && <Image src={preview} alt="Uploaded receipt" fill unoptimized className="object-contain" />}
            </div>
          </Card>
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="space-y-6 px-6 sm:px-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    value={draft.vendor}
                    onChange={(event) => setDraft({ ...draft, vendor: event.target.value })}
                    className="h-11 rounded-xl"
                    placeholder="Store or restaurant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={draft.date}
                    onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total</Label>
                  <Input
                    id="total"
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.total}
                    onChange={(event) => setDraft({ ...draft, total: Number(event.target.value) })}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Category</Label>
                  <Select
                    value={draft.category}
                    onValueChange={(category) => setDraft({ ...draft, category: category ?? "Other" })}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECEIPT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Line items</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDraft({ ...draft, items: [...draft.items, { name: "", price: 0 }] })}
                    className="text-primary"
                  >
                    <Plus className="size-4" /> Add item
                  </Button>
                </div>
                {draft.items.length === 0 && (
                  <p className="rounded-xl bg-zinc-50 px-4 py-5 text-center text-sm text-muted-foreground">
                    No line items detected. Add them if you want more detail.
                  </p>
                )}
                {draft.items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      aria-label={`Item ${index + 1} name`}
                      value={item.name}
                      placeholder="Item name"
                      onChange={(event) => {
                        const items = [...draft.items];
                        items[index] = { ...item, name: event.target.value };
                        setDraft({ ...draft, items });
                      }}
                      className="h-10 flex-1 rounded-xl"
                    />
                    <Input
                      aria-label={`Item ${index + 1} price`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(event) => {
                        const items = [...draft.items];
                        items[index] = { ...item, price: Number(event.target.value) };
                        setDraft({ ...draft, items });
                      }}
                      className="h-10 w-24 rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove item ${index + 1}`}
                      onClick={() => setDraft({ ...draft, items: draft.items.filter((_, itemIndex) => itemIndex !== index) })}
                      className="size-10 rounded-xl text-muted-foreground"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={saveReceipt}
                disabled={saving}
                size="lg"
                className="h-13 w-full rounded-full text-base shadow-[0_10px_28px_rgba(47,205,112,0.25)]"
              >
                {saving ? <LoaderCircle className="size-5 animate-spin" /> : <Check className="size-5" />}
                {saving ? "Saving…" : "Confirm & save receipt"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="mb-3 text-sm font-medium text-primary">From paper to organized in seconds</p>
      <h1 className="text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Snap it. We&apos;ll sort it.</h1>
      <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
        Upload a receipt and ReceiptSnap will pull out the important details for you to review.
      </p>
      <Card className="mt-10 border-0 bg-white p-3 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
        <CardContent
          className={cn(
            "flex min-h-80 flex-col items-center justify-center rounded-[1.35rem] border border-dashed bg-zinc-50/80 px-6 py-10 transition",
            dragging ? "border-primary bg-primary/[0.06]" : "border-zinc-200",
          )}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const selectedFile = event.dataTransfer.files?.[0];
            if (selectedFile) void scanReceipt(selectedFile);
          }}
        >
          <input
            ref={cameraInputRef}
            id="receipt-camera"
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0];
              if (selectedFile) void scanReceipt(selectedFile);
            }}
          />
          <input
            ref={galleryInputRef}
            id="receipt-gallery"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0];
              if (selectedFile) void scanReceipt(selectedFile);
            }}
          />
          <span className="mb-6 grid size-20 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-[0_12px_32px_rgba(47,205,112,0.25)]">
            <Camera className="size-9" strokeWidth={1.8} />
          </span>
          <span className="text-xl font-semibold">{dragging ? "Drop it here" : "Add your receipt"}</span>
          <span className="mt-2 text-sm text-muted-foreground">JPG, PNG, WebP, HEIC · up to 10 MB</span>
          <div className="mt-7 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
            <label
              htmlFor="receipt-camera"
              className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_10px_24px_rgba(47,205,112,0.2)] transition hover:bg-primary/80"
            >
              <Camera className="size-4" /> Take photo
            </label>
            <label
              htmlFor="receipt-gallery"
              className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              <Upload className="size-4" /> Photo library
            </label>
          </div>
          <span className="mt-5 hidden text-xs text-muted-foreground sm:block">or drag and drop an image here</span>
        </CardContent>
      </Card>
      <div className="mt-6 flex items-center justify-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><FileImage className="size-3.5" /> On-device OCR</span>
        <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> You confirm first</span>
      </div>
    </div>
  );
}
