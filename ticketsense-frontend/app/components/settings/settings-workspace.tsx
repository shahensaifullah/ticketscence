"use client";

import { Bell, Building2, KeyRound, Palette, Save, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/app/components/ui/product-ui";

const tabs = [
  { label: "Profile", icon: User },
  { label: "Appearance", icon: Palette },
  { label: "Notifications", icon: Bell },
  { label: "Security", icon: ShieldCheck },
  { label: "Workspace", icon: Building2 },
  { label: "API access", icon: KeyRound },
];

export function SettingsWorkspace() {
  const [active, setActive] = useState("Profile");
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1100px] space-y-6">
        <PageHeader description="Manage your profile, workspace preferences, and security." eyebrow="Workspace configuration" title="Settings" />
        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav className="h-fit rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-2">
            {tabs.map((tab) => { const Icon = tab.icon; return <button className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium ${active === tab.label ? "bg-[var(--secondary-container)] text-[var(--on-secondary-container)]" : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]"}`} key={tab.label} onClick={() => { setActive(tab.label); setSaved(false); }} type="button"><Icon size={15} />{tab.label}</button>; })}
          </nav>
          <section className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
            <header className="border-b border-[var(--outline-variant)] px-5 py-4"><h2 className="text-sm font-semibold">{active}</h2><p className="mt-1 text-xs text-[var(--outline)]">{settingsDescription[active]}</p></header>
            <div className="space-y-5 p-5">
              {active === "Profile" ? <ProfileSettings /> : active === "Appearance" ? <AppearanceSettings /> : active === "Notifications" ? <NotificationSettings /> : <GenericSettings section={active} />}
            </div>
            <footer className="flex items-center justify-end gap-3 border-t border-[var(--outline-variant)] px-5 py-4">{saved && <span className="text-xs text-[var(--success)]">Changes saved</span>}<button className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-container)] px-4 py-2.5 text-xs font-semibold text-[var(--on-primary-container)]" onClick={() => setSaved(true)} type="button"><Save size={14} /> Save changes</button></footer>
          </section>
        </div>
      </div>
    </div>
  );
}

const settingsDescription: Record<string, string> = {
  Profile: "Update your personal details and workspace identity.",
  Appearance: "Choose how TicketSense looks on this device.",
  Notifications: "Control which events reach you and where.",
  Security: "Password, two-factor authentication, and active sessions.",
  Workspace: "Workspace defaults, members, and permissions.",
  "API access": "Personal access tokens and integration credentials.",
};

const inputClass = "mt-2 h-10 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 text-sm outline-none focus:border-[var(--primary)]";

function ProfileSettings() {
  return <><div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-full bg-[var(--secondary-container)] text-sm font-bold text-[var(--on-secondary-container)]">AM</span><button className="rounded-lg border border-[var(--outline-variant)] px-3 py-2 text-xs font-semibold" type="button">Change avatar</button></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium">First name<input className={inputClass} defaultValue="Alex" /></label><label className="text-xs font-medium">Last name<input className={inputClass} defaultValue="Morgan" /></label><label className="text-xs font-medium">Job title<input className={inputClass} defaultValue="Engineering Manager" /></label><label className="text-xs font-medium">Timezone<select className={inputClass} defaultValue="Europe/Berlin"><option>Europe/Berlin</option><option>America/New_York</option><option>Asia/Singapore</option></select></label></div></>;
}

function AppearanceSettings() {
  return <div className="grid gap-3 sm:grid-cols-3">{["System", "Light", "Dark"].map((theme, index) => <button className={`rounded-xl border p-4 text-left ${index === 0 ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary-container)_8%,transparent)]" : "border-[var(--outline-variant)]"}`} key={theme} type="button"><span className="mb-4 block h-16 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container)]" /><strong className="text-xs">{theme}</strong></button>)}</div>;
}

function NotificationSettings() {
  return <div className="space-y-3">{["Ticket assignments", "Mentions and replies", "SLA warnings", "AI solution available", "Weekly summary"].map((label, index) => <label className="flex items-center justify-between rounded-lg border border-[var(--outline-variant)] p-4 text-xs" key={label}><span>{label}</span><input className="size-4 accent-[var(--primary-container)]" defaultChecked={index < 4} type="checkbox" /></label>)}</div>;
}

function GenericSettings({ section }: { section: string }) {
  return <div className="rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container)] p-5"><h3 className="text-sm font-semibold">{section} controls</h3><p className="mt-2 text-xs leading-5 text-[var(--on-surface-variant)]">These controls are ready for the corresponding Django API. Changes in this frontend preview remain local.</p></div>;
}
