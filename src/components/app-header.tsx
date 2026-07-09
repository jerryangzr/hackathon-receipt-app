"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, LayoutDashboard, ReceiptText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f7f7f5]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:h-20 sm:px-8">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ReceiptText className="size-5" />
          </span>
          <span className="text-lg">ReceiptSnap</span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-black/5">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "rounded-full px-3",
              pathname === "/dashboard" && "bg-zinc-100",
            )}
          >
            <LayoutDashboard className="size-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link href="/upload" className={cn(buttonVariants({ size: "sm" }), "rounded-full px-3")}>
            <Camera className="size-4" />
            <span className="hidden sm:inline">Snap receipt</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
