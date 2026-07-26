import type { Metadata } from "next";
import { ProductShell } from "@/app/components/product-shell";
import { SettingsWorkspace } from "@/app/components/settings/settings-workspace";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <ProductShell><SettingsWorkspace /></ProductShell>;
}
