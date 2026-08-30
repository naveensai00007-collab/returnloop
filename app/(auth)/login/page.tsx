"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MagicLinkSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = MagicLinkSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.errors[0]?.message || "Enter a valid email address.");
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      const origin = window.location.origin;
      const redirectUrl = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("rate limit")) {
          setError("Too many attempts. Wait a minute and try again.");
        } else {
          setError(authError.message || "Could not send login link. Try again.");
        }
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("Could not send login link. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      {isSuccess ? (
        <div className="text-center py-4 space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-subtle text-primary">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-neutral-900">
              Check your email
            </h3>
            <p className="text-sm text-neutral-600">
              We sent a magic login link to{" "}
              <span className="font-semibold text-neutral-900">{email}</span>.
            </p>
          </div>
          <p className="text-xs text-neutral-500 pt-2">
            Click the link in your email to sign in instantly without a password.
          </p>
          <div className="pt-2">
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => {
                setIsSuccess(false);
                setEmail("");
              }}
              className="text-xs"
            >
              Did not get it? Try again
            </Button>
          </div>
        </div>
      ) : (
        <>
          <CardHeader className="text-left px-0 pt-0">
            <CardTitle className="text-xl">Sign in to ReturnLoop</CardTitle>
            <CardDescription>
              Enter your email address to receive a secure login link.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                error={error || undefined}
                disabled={isLoading}
                autoFocus
                required
              />
              <Button
                type="submit"
                className="w-full gap-2 font-medium"
                isLoading={isLoading}
              >
                <Mail className="w-4 h-4" />
                Send me login link
              </Button>
            </form>
          </CardContent>
        </>
      )}
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-surface">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 mb-3 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-neutral-900">
              Return<span className="text-primary">Loop</span>
            </span>
          </Link>
          <p className="text-sm text-neutral-500">
            Never lose money to a missed return window.
          </p>
        </div>

        {/* Suspense wrapper for useSearchParams */}
        <React.Suspense fallback={<div className="h-64 rounded-card bg-white animate-pulse" />}>
          <LoginForm />
        </React.Suspense>

        {/* Footer Link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
