export type ReceiptItem = {
  name: string;
  price: number;
};

export type ReceiptDraft = {
  vendor: string;
  date: string;
  total: number;
  category: string;
  items: ReceiptItem[];
  rawText?: string;
};

export const RECEIPT_CATEGORIES = [
  "Dining",
  "Groceries",
  "Shopping",
  "Transport",
  "Entertainment",
  "Health",
  "Other",
] as const;

const MONEY = /(?:NT\$|TWD|USD|\$)?\s*(-?\d{1,6}(?:[,.]\d{2}))/i;
const TOTAL_WORDS = /\b(grand\s*total|total|amount\s*due|balance\s*due)\b/i;

function toNumber(value: string) {
  return Number(value.replace(",", ""));
}

function toIsoDate(value: string) {
  const parts = value.replace(/[.\-]/g, "/").split("/").map(Number);
  if (parts.length !== 3) return "";

  let [a, b, c] = parts;
  let year: number;
  let month: number;
  let day: number;

  if (a > 1900) {
    [year, month, day] = [a, b, c];
  } else {
    [month, day, year] = [a, b, c];
    if (year < 100) year += 2000;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function inferCategory(text: string) {
  const value = text.toLowerCase();
  if (/(cafe|coffee|restaurant|kitchen|burger|pizza|tea|bakery)/.test(value)) return "Dining";
  if (/(market|grocery|mart|foods|supermarket|costco)/.test(value)) return "Groceries";
  if (/(uber|lyft|taxi|metro|rail|parking|fuel|gas station)/.test(value)) return "Transport";
  if (/(pharmacy|clinic|drug|health)/.test(value)) return "Health";
  if (/(cinema|theatre|movie|game|spotify)/.test(value)) return "Entertainment";
  if (/(store|shop|mall|uniqlo|target|ikea)/.test(value)) return "Shopping";
  return "Other";
}

export function parseReceiptText(rawText: string): ReceiptDraft {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const dateMatch = rawText.match(/\b(?:20\d{2}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[./-]\d{1,2}[./-](?:20)?\d{2})\b/);
  const date = dateMatch ? toIsoDate(dateMatch[0]) : new Date().toISOString().slice(0, 10);

  const totalCandidates = lines
    .map((line, index) => {
      const match = line.match(MONEY);
      return match
        ? { value: toNumber(match[1]), score: TOTAL_WORDS.test(line) ? 100 + index : index }
        : null;
    })
    .filter((candidate): candidate is { value: number; score: number } => Boolean(candidate))
    .sort((a, b) => b.score - a.score);

  const items = lines.flatMap((line) => {
    if (TOTAL_WORDS.test(line) || /\b(subtotal|tax|change|cash|visa|mastercard)\b/i.test(line)) return [];
    const match = line.match(/^(.{2,}?)\s+(?:NT\$|TWD|USD|\$)?\s*(\d{1,6}(?:[,.]\d{2}))$/i);
    if (!match) return [];
    const price = toNumber(match[2]);
    return Number.isFinite(price) ? [{ name: match[1].trim(), price }] : [];
  });

  const vendor =
    lines.find(
      (line) =>
        line.length > 2 &&
        line.length < 60 &&
        !MONEY.test(line) &&
        !/\b(receipt|invoice|date|time|tel|phone|address|tax)\b/i.test(line),
    ) ?? "Unknown vendor";

  return {
    vendor,
    date,
    total: totalCandidates[0]?.value ?? 0,
    category: inferCategory(`${vendor} ${items.map((item) => item.name).join(" ")}`),
    items,
    rawText,
  };
}
