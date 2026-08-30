"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, Globe, LogOut, Trash2, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/lib/use-toast";
import { createClient } from "@/lib/supabase/client";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export function SettingsForm() {
  const router = useRouter();

  const [reminderEnabled, setReminderEnabled] = React.useState(true);
  const [timezone, setTimezone] = React.useState("UTC");
  const [email, setEmail] = React.useState<string>("");

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSignOutLoading, setIsSignOutLoading] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // Fetch initial profile
  React.useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/profile");
        const data = await res.json();

        if (res.ok && data.profile) {
          setReminderEnabled(data.profile.reminder_enabled ?? true);
          setTimezone(data.profile.timezone || "UTC");
          setEmail(data.profile.email || "");
        }
      } catch {
        toast({
          title: "Could not load settings",
          variant: "error",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminder_enabled: reminderEnabled,
          timezone,
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings.");

      toast({
        title: "Settings saved.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Could not save settings",
        description: "Check your connection and try again.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSignOutLoading(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setIsSignOutLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch("/api/profile/delete", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to delete account.");

      const supabase = createClient();
      await supabase.auth.signOut();

      toast({
        title: "Account deleted.",
        description: "All purchases and reminder data have been removed.",
        variant: "default",
      });

      router.push("/");
      router.refresh();
    } catch {
      toast({
        title: "Could not delete account",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-xl text-left">
        <div className="h-44 rounded-card bg-neutral-100 animate-pulse" />
        <div className="h-32 rounded-card bg-neutral-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl text-left">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Reminders Preferences */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-primary" />
              <span>Reminders</span>
            </CardTitle>
            <CardDescription>
              Control when ReturnLoop sends you email notifications for upcoming deadlines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4 p-3.5 rounded-lg border border-border bg-neutral-50/50">
              <div className="space-y-0.5">
                <label
                  htmlFor="reminder-toggle"
                  className="text-sm font-semibold text-neutral-900 cursor-pointer"
                >
                  Email reminders
                </label>
                <p className="text-xs text-neutral-500">
                  Receive email notifications before return windows close.
                </p>
              </div>
              <input
                id="reminder-toggle"
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
              />
            </div>

            <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-md border border-neutral-200">
              <p className="font-medium text-neutral-700 mb-1">Standard reminder schedule:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li><strong>7 days</strong> before return window closes</li>
                <li><strong>3 days</strong> before return window closes</li>
                <li><strong>1 day</strong> before return window closes</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Timezone & Account */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-neutral-600" />
              <span>Preferences</span>
            </CardTitle>
            <CardDescription>
              Account email: <span className="font-semibold text-neutral-900">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="timezone-select"
                className="block text-sm font-medium text-neutral-900"
              >
                Timezone
              </label>
              <select
                id="timezone-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="flex h-11 w-full rounded-input border border-border bg-white px-3.5 py-2 text-base text-neutral-900 focus-visible:border-primary focus-visible:outline-none"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto">
          Save settings
        </Button>
      </form>

      {/* Account Actions */}
      <Card className="shadow-sm border-neutral-200">
        <CardHeader>
          <CardTitle className="text-base text-neutral-900">Session & Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
            <div>
              <p className="text-sm font-medium text-neutral-900">Sign out of ReturnLoop</p>
              <p className="text-xs text-neutral-500">End your current session on this device.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSignOut}
              isLoading={isSignOutLoading}
              className="gap-1.5 shrink-0"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <p className="text-sm font-medium text-semantic-error">Delete Account</p>
              <p className="text-xs text-neutral-500">
                Permanently removes your purchases, reminders, and account details.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-1.5 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Delete your account?"
        description="This action cannot be undone."
      >
        <div className="space-y-4 text-left">
          <div className="p-3.5 rounded-lg bg-semantic-error-subtle border border-red-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-semantic-error shrink-0 mt-0.5" />
            <p className="text-sm text-neutral-800">
              Deleting your account will permanently remove all tracked purchases, return deadlines, and scheduled reminders.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAccount}
              isLoading={isDeleting}
            >
              Permanently delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
