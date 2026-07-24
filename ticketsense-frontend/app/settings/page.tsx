import type { Metadata } from "next";
import { ProductShell } from "../components/product-shell";
import { SettingsWorkspace } from "./settings-workspace";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <ProductShell><SettingsWorkspace /></ProductShell>;
}
