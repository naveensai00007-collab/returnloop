import { SettingsForm } from "@/components/settings/settings-form";

export const metadata = {
  title: "Settings — ReturnLoop",
  description: "Manage email reminders and account preferences.",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="mb-6 text-left">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your notification schedules and account preferences.
        </p>
      </div>

      <SettingsForm />
    </div>
  );
}
