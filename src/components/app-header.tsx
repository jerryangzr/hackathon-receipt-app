"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, ChartPie, Clock3, Home, LayoutDashboard, ReceiptText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f7f7f5]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:h-20 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ReceiptText className="size-5" />
            </span>
            <span className="text-lg">ReceiptSnap</span>
          </Link>
          <nav className="flex items-center gap-1">
            {pathname === "/" && (
              <div className="mr-3 hidden items-center gap-6 text-sm text-muted-foreground md:flex">
                <a href="#how-it-works" className="transition hover:text-foreground">How it works</a>
                <a href="#insights" className="transition hover:text-foreground">Insights</a>
                <a href="#privacy" className="transition hover:text-foreground">Privacy</a>
              </div>
            )}
            <div className="hidden items-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-black/5 sm:flex">
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "rounded-full px-3",
                  pathname === "/dashboard" && "bg-zinc-100",
                )}
              >
                <LayoutDashboard className="size-4" />
                Dashboard
              </Link>
              <Link href="/upload" className={cn(buttonVariants({ size: "sm" }), "rounded-full px-3")}>
                <Camera className="size-4" />
                Snap receipt
              </Link>
            </div>
          </nav>
        </div>
      </header>
      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-[1.4rem] border border-white/70 bg-white/92 p-1.5 shadow-[0_16px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:hidden">
        {[
          { href: "/", label: "Home", icon: Home, active: pathname === "/" },
          { href: "/dashboard#recent", label: "Receipts", icon: Clock3, active: false },
          { href: "/upload", label: "Snap", icon: Camera, active: pathname === "/upload", primary: true },
          { href: "/dashboard#insights", label: "Insights", icon: ChartPie, active: pathname === "/dashboard" },
        ].map(({ href, label, icon: Icon, active, primary }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex min-h-13 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-medium text-muted-foreground transition",
              active && "bg-zinc-100 text-foreground",
              primary && "bg-primary text-primary-foreground shadow-sm",
            )}
          >
            <Icon className="size-4.5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
