import type { Metadata } from "next";
import { ProductShell } from "../components/product-shell";
import { AssistantWorkspace } from "./assistant-workspace";

export const metadata: Metadata = { title: "AI Assistant" };

export default function AssistantPage() {
  return <ProductShell><AssistantWorkspace /></ProductShell>;
}
