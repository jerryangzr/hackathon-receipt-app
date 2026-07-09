import type { Receipt } from "@/lib/receipt-data";
import type { ReceiptDraft } from "@/lib/receipt-parser";

const STORAGE_KEY = "receiptsnap-demo-receipts";

export function getLocalReceipts(): Receipt[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Receipt[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalReceipt(draft: ReceiptDraft) {
  const receipt: Receipt = {
    id: crypto.randomUUID(),
    vendor: draft.vendor.trim(),
    date: draft.date,
    items: draft.items,
    total: draft.total,
    category: draft.category,
    image_url: null,
    created_at: new Date().toISOString(),
  };
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([receipt, ...getLocalReceipts()]),
  );
  return receipt;
}
