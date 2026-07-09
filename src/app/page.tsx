import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Camera,
  Check,
  CheckCircle2,
  LockKeyhole,
  ReceiptText,
  ScanText,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="flex-1 overflow-hidden">
      <section className="relative px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-24">
        <div className="pointer-events-none absolute left-1/2 top-10 -z-10 size-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <Badge className="mb-6 rounded-full border-0 bg-primary/12 px-3 py-1.5 text-primary">
              <Sparkles className="size-3.5" /> Receipts, finally useful
            </Badge>
            <h1 className="text-5xl font-semibold leading-[0.96] tracking-[-0.065em] sm:text-7xl">
              Your spending,
              <span className="block text-primary">beautifully clear.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Snap any receipt. ReceiptSnap reads the details, lets you verify every field, and turns purchases into a simple financial picture.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/upload" className={cn(buttonVariants({ size: "lg" }), "h-13 rounded-full px-7 text-base shadow-[0_14px_35px_rgba(47,205,112,0.25)]")}>
                <Camera className="size-5" /> Snap your first receipt
              </Link>
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-13 rounded-full bg-white px-7 text-base")}>
                Explore dashboard <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><Check className="size-4 text-primary" /> Free OCR</span>
              <span className="flex items-center gap-2"><Check className="size-4 text-primary" /> Private by default</span>
              <span className="flex items-center gap-2"><Check className="size-4 text-primary" /> No account required</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:mr-0">
            <div className="absolute -inset-6 -z-10 rotate-3 rounded-[2.5rem] bg-primary/15" />
            <Card className="overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-[0_35px_100px_rgba(25,35,28,0.16)]">
              <div className="bg-primary px-7 pb-16 pt-7">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-black/60">This month</span>
                  <span className="grid size-9 place-items-center rounded-full bg-black/10"><BarChart3 className="size-4" /></span>
                </div>
                <p className="mt-6 text-5xl font-semibold tracking-[-0.06em]">$1,284.60</p>
                <p className="mt-2 text-sm text-black/55">from 24 organized receipts</p>
              </div>
              <CardContent className="-mt-8 px-5 pb-5">
                <div className="rounded-3xl bg-zinc-950 p-5 text-white shadow-xl">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/45">Latest receipt</p>
                      <p className="mt-1 font-medium">Morning Brew Coffee</p>
                    </div>
                    <span className="grid size-10 place-items-center rounded-2xl bg-white/10"><ReceiptText className="size-4" /></span>
                  </div>
                  <div className="flex items-end justify-between border-t border-white/10 pt-4">
                    <div>
                      <p className="text-xs text-white/45">Dining · Today</p>
                      <p className="mt-1 text-2xl font-semibold">$12.80</p>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs text-primary">
                      <CheckCircle2 className="size-3.5" /> Verified
                    </span>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[["Dining", "42%", "h-16"], ["Shopping", "31%", "h-11"], ["Travel", "27%", "h-9"]].map(([label, value, height]) => (
                    <div key={label} className="rounded-2xl bg-zinc-50 p-3">
                      <div className="flex h-16 items-end">
                        <span className={cn("w-full rounded-lg bg-primary", height)} />
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">{label}</p>
                      <p className="text-sm font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="absolute -bottom-5 -left-8 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-black/5 sm:flex">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/15"><Zap className="size-4 text-primary" /></span>
              <div><p className="text-xs text-muted-foreground">OCR complete</p><p className="text-sm font-medium">Ready to review</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white/70 px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm text-muted-foreground sm:justify-between">
          <span>On-device OCR</span><span>Editable before save</span><span>Private receipt storage</span><span>Installable on mobile</span>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="reveal max-w-2xl">
            <p className="text-sm font-medium text-primary">A calmer workflow</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">From camera roll to clarity.</h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">Three deliberate steps. You stay in control before anything is recorded.</p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { icon: Camera, step: "01", title: "Snap or upload", copy: "Take a fresh photo or choose a receipt screenshot from your library." },
              { icon: ScanText, step: "02", title: "Read automatically", copy: "Free, open-source OCR finds the vendor, date, total, and line items." },
              { icon: CheckCircle2, step: "03", title: "Review and confirm", copy: "Correct any field, choose a category, then explicitly approve the save." },
            ].map(({ icon: Icon, step, title, copy }) => (
              <Card key={step} className="reveal border-0 bg-white shadow-sm">
                <CardContent className="px-7 py-8">
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary"><Icon className="size-5" /></span>
                    <span className="text-sm font-medium text-zinc-300">{step}</span>
                  </div>
                  <h3 className="mt-10 text-xl font-semibold">{title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{copy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="insights" className="scroll-mt-20 px-5 sm:px-8">
        <div className="reveal mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-zinc-950 px-6 py-16 text-white sm:px-12 sm:py-20">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <Badge className="border-0 bg-white/10 text-primary">Built for useful patterns</Badge>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">See where your money actually goes.</h2>
              <p className="mt-5 max-w-lg text-lg leading-8 text-white/55">A banking-style overview groups every confirmed receipt into clear categories, totals, and recent activity.</p>
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "mt-8 h-12 rounded-full bg-white px-6 text-zinc-950")}>
                View your insights <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/6 p-6 sm:row-span-2">
                <p className="text-sm text-white/45">Category mix</p>
                <div className="mx-auto my-7 grid aspect-square max-w-48 place-items-center rounded-full bg-[conic-gradient(#2fcd70_0_42%,#8ee8b4_42%_68%,#3f3f46_68%_100%)]">
                  <div className="grid size-28 place-items-center rounded-full bg-zinc-950 text-center">
                    <div><p className="text-2xl font-semibold">7</p><p className="text-xs text-white/45">categories</p></div>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-white/50">Dining</span><span>42%</span></div>
                  <div className="flex justify-between"><span className="text-white/50">Shopping</span><span>26%</span></div>
                  <div className="flex justify-between"><span className="text-white/50">Everything else</span><span>32%</span></div>
                </div>
              </div>
              <div className="rounded-3xl bg-primary p-6 text-zinc-950">
                <ReceiptText className="size-5" />
                <p className="mt-8 text-3xl font-semibold">24</p>
                <p className="text-sm text-black/55">receipts this month</p>
              </div>
              <div className="rounded-3xl bg-white/6 p-6">
                <Sparkles className="size-5 text-primary" />
                <p className="mt-8 text-lg font-semibold">Weekly Draw</p>
                <p className="mt-1 text-sm text-white/45">A playful reason to keep logging.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="privacy" className="scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
        <div className="reveal mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="max-w-xl">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/12 text-primary"><ShieldCheck className="size-6" /></span>
            <h2 className="mt-7 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Private by design, not by promise.</h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">OCR runs in your browser. Nothing is logged until you review and confirm. Connected storage is private and isolated to your session.</p>
          </div>
          <div className="grid gap-4">
            {[
              [ScanText, "OCR stays on-device", "Your browser reads the receipt without sending it to a third-party AI service."],
              [LockKeyhole, "Your records stay yours", "Private storage and owner-scoped access rules isolate confirmed receipts."],
              [CheckCircle2, "Confirmation is mandatory", "Extracted values are always editable and never silently auto-saved."],
            ].map(([Icon, title, copy]) => {
              const FeatureIcon = Icon as typeof ScanText;
              return (
                <div key={title as string} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-zinc-100"><FeatureIcon className="size-4" /></span>
                  <div><h3 className="font-medium">{title as string}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{copy as string}</p></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 pb-8 sm:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-primary px-6 py-14 text-center sm:px-12 sm:py-20">
          <h2 className="text-4xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-5xl">Make your next receipt count.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-black/55">Your first organized purchase is one photo away.</p>
          <Link href="/upload" className={cn(buttonVariants({ size: "lg" }), "mt-8 h-13 rounded-full bg-zinc-950 px-7 text-base text-white hover:bg-zinc-800")}>
            <Camera className="size-5" /> Snap a receipt
          </Link>
        </div>
      </section>

      <footer className="px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2 font-medium text-foreground"><ReceiptText className="size-4 text-primary" /> ReceiptSnap</span>
          <span>Built for the receipts worth keeping.</span>
        </div>
      </footer>
    </main>
  );
}
