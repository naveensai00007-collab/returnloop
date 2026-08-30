import Link from "next/link";
import { ArrowRight, Clock, Bell, CheckCircle2, ShieldCheck, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  let userEmail: string | null = null;
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email || null;
  } catch {
    // If Supabase not connected yet in dev
  }

  const primaryCtaHref = userEmail ? "/add" : "/login";

  return (
    <div className="flex min-h-screen flex-col bg-background text-neutral-900">
      <Navbar userEmail={userEmail} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-4xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          {/* Subtle Early Access Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-subtle text-primary border border-green-200 text-xs font-semibold uppercase tracking-wider mb-6">
            <span>Free Early Access</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-6xl max-w-3xl mx-auto leading-tight">
            Never miss a return window.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Track purchases across stores, see exact return deadlines, and get reminders before you lose money.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={primaryCtaHref}>
              <Button size="lg" className="gap-2 font-semibold shadow-sm w-full sm:w-auto text-base h-12 px-8">
                <span>Track my first purchase</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base h-12">
                See how it works
              </Button>
            </Link>
          </div>
        </section>

        {/* 3-Step Process */}
        <section id="how-it-works" className="border-t border-border bg-surface py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                How ReturnLoop works
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                A simple 3-step loop to recover your money.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {/* Step 1 */}
              <Card className="bg-white shadow-sm p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary font-bold text-base mb-4 border border-green-200">
                  1
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Add a purchase
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Choose a store or type custom details in under 60 seconds. Common store return policies are suggested automatically.
                </p>
              </Card>

              {/* Step 2 */}
              <Card className="bg-white shadow-sm p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary font-bold text-base mb-4 border border-green-200">
                  2
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  See exact deadlines
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  ReturnLoop calculates your precise calendar return deadline and ranks purchases by urgency on your dashboard.
                </p>
              </Card>

              {/* Step 3 */}
              <Card className="bg-white shadow-sm p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary font-bold text-base mb-4 border border-green-200">
                  3
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Get reminded in time
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Receive automated email notifications 7, 3, and 1 day before your return window closes. Mark returned to track recovered cash.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Privacy & Trust Note */}
        <section className="border-t border-border py-16">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 mx-auto mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">
              Private, restrained, and spam-free.
            </h2>
            <p className="text-sm text-neutral-600 max-w-xl mx-auto leading-relaxed mb-6">
              ReturnLoop exists only to help you avoid losing money. We do not sell your personal data, we do not send marketing spam, and you can delete your account and all records anytime.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                No password required (Magic link)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Encrypted storage
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                One-click account deletion
              </span>
            </div>

            <div className="mt-8">
              <Link href={primaryCtaHref}>
                <Button size="lg" className="gap-2 font-semibold">
                  Get started for free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8 text-center text-xs text-neutral-500">
        <div className="mx-auto max-w-4xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800">ReturnLoop</span>
            <span>— Consumer money-recovery tool</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-neutral-900">
              Sign in
            </Link>
            <Link href="/add" className="hover:text-neutral-900">
              Add purchase
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
