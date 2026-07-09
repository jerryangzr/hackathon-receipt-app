import type { ReceiptItem } from "@/lib/receipt-parser";

export type Receipt = {
  id: string;
  vendor: string;
  date: string;
  items: ReceiptItem[];
  total: number;
  category: string;
  image_url: string | null;
  created_at: string;
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function categoryColor(category: string) {
  const colors: Record<string, string> = {
    Dining: "bg-orange-100 text-orange-700",
    Groceries: "bg-emerald-100 text-emerald-700",
    Shopping: "bg-violet-100 text-violet-700",
    Transport: "bg-blue-100 text-blue-700",
    Entertainment: "bg-pink-100 text-pink-700",
    Health: "bg-cyan-100 text-cyan-700",
    Other: "bg-zinc-100 text-zinc-700",
  };
  return colors[category] ?? colors.Other;
}

function dateParts(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year: match[1], month, day };
}

export function formatReceiptDate(date: string) {
  const parts = dateParts(date);
  if (!parts) return date;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parts.month - 1]} ${parts.day}`;
}

export function formatReceiptDateFull(date: string) {
  const parts = dateParts(date);
  if (!parts) return date;
  return `${parts.month}/${parts.day}/${parts.year}`;
}
