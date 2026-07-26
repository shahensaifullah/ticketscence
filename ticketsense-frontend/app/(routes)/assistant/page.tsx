import type { Metadata } from "next";
import { AssistantWorkspace } from "@/app/components/assistant/assistant-workspace";
import { ProductShell } from "@/app/components/product-shell";

export const metadata: Metadata = { title: "AI Assistant" };

export default function AssistantPage() {
  return <ProductShell><AssistantWorkspace /></ProductShell>;
}
