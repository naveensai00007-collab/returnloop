"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/lib/../components/ui/button";

interface NavbarProps {
  userEmail?: string | null;
}

export function Navbar({ userEmail }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isAuthOrMarketing = pathname === "/" || pathname === "/login";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand Wordmark with SVG Logo */}
        <Link
          href={userEmail ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
            {/* SVG return arrow mark */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M9 14 4 9l5-5" />
              <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
            </svg>
          </div>
          <span className="text-xl font-medium tracking-tight text-neutral-900">
            Return<span className="font-bold text-primary">Loop</span>
          </span>
        </Link>

        {/* Navigation Links */}
        {!isAuthOrMarketing && (
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "bg-primary-subtle text-primary font-semibold"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/settings"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/settings"
                  ? "bg-primary-subtle text-primary font-semibold"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </nav>
        )}

        {/* Right CTA / Actions */}
        <div className="flex items-center gap-3">
          {userEmail ? (
            <>
              <Link href="/add">
                <Button size="sm" className="gap-1.5 font-medium shadow-sm">
                  <Plus className="w-4 h-4" />
                  <span>Add purchase</span>
                </Button>
              </Link>
              <Button
                variant="tertiary"
                size="sm"
                onClick={handleSignOut}
                isLoading={isLoggingOut}
                className="hidden sm:inline-flex text-neutral-500 hover:text-neutral-900"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
