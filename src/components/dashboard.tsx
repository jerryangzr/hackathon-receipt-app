"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Camera,
  LoaderCircle,
  PartyPopper,
  ReceiptText,
  RotateCcw,
  Sparkles,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  categoryColor,
  formatCurrency,
  formatReceiptDate,
  formatReceiptDateFull,
  type Receipt,
} from "@/lib/receipt-data";
import { getLocalReceipts } from "@/lib/local-receipts";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#2fcd70", "#111411", "#8ee8b4", "#71717a", "#b7f3cf", "#a1a1aa", "#dcfce7"];

async function fetchReceipts() {
  if (!hasSupabaseConfig()) return getLocalReceipts();
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data as Receipt[]) ?? [];
}

export function Dashboard() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawOpen, setDrawOpen] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [winner, setWinner] = useState<Receipt | null>(null);
  const drawTimeoutRef = useRef<number | null>(null);

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReceipts(await fetchReceipts());
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : "Could not load receipts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchReceipts()
      .then((data) => {
        if (!cancelled) setReceipts(data);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : "Could not load receipts.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (drawTimeoutRef.current !== null) {
        window.clearTimeout(drawTimeoutRef.current);
      }
    };
  }, []);

  const total = useMemo(() => receipts.reduce((sum, receipt) => sum + Number(receipt.total), 0), [receipts]);
  const chartData = useMemo(() => {
    const totals = new Map<string, number>();
    receipts.forEach((receipt) => {
      totals.set(receipt.category, (totals.get(receipt.category) ?? 0) + Number(receipt.total));
    });
    return [...totals.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [receipts]);

  function runDraw() {
    if (!receipts.length) return;
    setWinner(null);
    setDrawOpen(true);
    setDrawing(true);
    if (drawTimeoutRef.current !== null) {
      window.clearTimeout(drawTimeoutRef.current);
    }
    drawTimeoutRef.current = window.setTimeout(() => {
      setWinner(receipts[Math.floor(Math.random() * receipts.length)]);
      setDrawing(false);
      drawTimeoutRef.current = null;
    }, 1400);
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Your receipt ritual</p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Good afternoon.</h1>
          <p className="mt-3 text-muted-foreground">Every receipt organized. Every receipt in the draw.</p>
          {!hasSupabaseConfig() && (
            <Badge variant="secondary" className="mt-4 rounded-full bg-white px-3 py-1 text-zinc-600">
              Private demo mode · saved on this device
            </Badge>
          )}
        </div>
        <Button
          onClick={runDraw}
          disabled={!receipts.length || loading}
          size="lg"
          className="h-12 rounded-full px-6 shadow-[0_10px_28px_rgba(47,205,112,0.25)]"
        >
          <Sparkles className="size-5" /> Weekly Draw
        </Button>
      </div>

      {error ? (
        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <ReceiptText className="mb-4 size-9 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Connect Supabase to see your receipts</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => void loadReceipts()} variant="outline" className="mt-6 rounded-full">
              <RotateCcw className="size-4" /> Try again
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid min-h-80 place-items-center">
          <LoaderCircle className="size-7 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            <Card className="relative overflow-hidden border-0 bg-zinc-950 text-white shadow-sm md:col-span-2">
              <div className="absolute -right-12 -top-16 size-52 rounded-full bg-primary/30 blur-3xl" />
              <CardContent className="relative flex min-h-48 flex-col justify-between px-7 py-7 sm:px-9">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Total logged</span>
                  <TrendingUp className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-5xl font-semibold tracking-[-0.06em] sm:text-6xl">{formatCurrency(total)}</p>
                  <p className="mt-3 text-sm text-white/50">
                    Across {receipts.length} {receipts.length === 1 ? "receipt" : "receipts"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-primary text-primary-foreground shadow-sm">
              <CardContent className="flex min-h-48 flex-col justify-between px-7 py-7">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-black/10">
                  <Ticket className="size-5" />
                </div>
                <div>
                  <p className="text-4xl font-semibold tracking-tight">{receipts.length}</p>
                  <p className="mt-1 text-sm text-black/55">Weekly Draw entries</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-0 bg-white shadow-sm">
              <CardHeader className="px-7 pt-7">
                <CardTitle className="text-base">Spending by category</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-5 sm:px-7">
                {chartData.length ? (
                  <div className="grid min-h-64 items-center gap-4 sm:grid-cols-[1fr_auto]">
                    <div className="h-64 min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="amount"
                            nameKey="category"
                            innerRadius={58}
                            outerRadius={96}
                            paddingAngle={3}
                            stroke="none"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value))}
                          contentStyle={{ border: 0, borderRadius: 14, boxShadow: "0 12px 35px rgba(0,0,0,.1)" }}
                        />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 px-4 pb-5 sm:px-0 sm:pr-4">
                      {chartData.map((entry, index) => (
                        <div key={entry.category} className="flex min-w-40 items-center gap-2 text-sm">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span className="flex-1 text-muted-foreground">{entry.category}</span>
                          <span className="font-medium tabular-nums">{formatCurrency(entry.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid h-64 place-items-center text-sm text-muted-foreground">Your category chart will appear here.</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm">
              <CardHeader className="flex-row items-center justify-between px-7 pt-7">
                <CardTitle className="text-base">Recent receipts</CardTitle>
                <Badge variant="secondary" className="rounded-full">{receipts.length}</Badge>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {receipts.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                    <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-zinc-100">
                      <ReceiptText className="size-5 text-muted-foreground" />
                    </span>
                    <p className="font-medium">No receipts yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Snap your first one to get started.</p>
                    <Link href="/upload" className={cn(buttonVariants(), "mt-5 rounded-full")}>
                      <Camera className="size-4" /> Snap receipt
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {receipts.slice(0, 5).map((receipt) => (
                      <div key={receipt.id} className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-zinc-50">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-zinc-100">
                          <ReceiptText className="size-4.5 text-zinc-600" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{receipt.vendor}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays className="size-3" />
                            {formatReceiptDate(receipt.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums">{formatCurrency(Number(receipt.total))}</p>
                          <Badge className={cn("mt-1 border-0 text-[10px]", categoryColor(receipt.category))}>
                            {receipt.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Dialog open={drawOpen} onOpenChange={setDrawOpen}>
        <DialogContent className="overflow-hidden rounded-3xl border-0 p-0 sm:max-w-md">
          <div className="relative min-h-96 bg-zinc-950 px-8 py-10 text-center text-white">
            {!drawing && winner && [...Array(18)].map((_, index) => (
              <i
                key={index}
                className="confetti absolute left-1/2 top-1/3 block size-2 bg-primary"
                style={{ "--i": index } as React.CSSProperties}
              />
            ))}
            <DialogHeader className="relative items-center">
              <div className="mb-5 grid size-16 place-items-center rounded-full bg-primary text-zinc-950">
                {drawing ? <LoaderCircle className="size-7 animate-spin" /> : <PartyPopper className="size-7" />}
              </div>
              <DialogTitle className="text-2xl text-white">{drawing ? "Drawing a receipt…" : "This week’s lucky receipt"}</DialogTitle>
              <DialogDescription className="text-white/50">
                {drawing ? "Every logged receipt has an equal chance." : "A little celebration for staying organized."}
              </DialogDescription>
            </DialogHeader>
            {!drawing && winner && (
              <div className="relative mt-7 overflow-hidden rounded-2xl bg-white p-5 text-left text-zinc-950">
                {winner.image_url && (
                  <div className="relative mb-4 h-28 overflow-hidden rounded-xl bg-zinc-100">
                    <Image src={winner.image_url} alt="" fill unoptimized className="object-cover" />
                  </div>
                )}
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-primary">Winner</p>
                    <p className="mt-1 text-lg font-semibold">{winner.vendor}</p>
                    <p className="text-sm text-muted-foreground">{formatReceiptDateFull(winner.date)}</p>
                  </div>
                  <p className="text-xl font-semibold">{formatCurrency(Number(winner.total))}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
