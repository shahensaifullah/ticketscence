import type { Metadata } from "next";
import { ProductShell } from "@/app/components/product-shell";
import { TopicWorkspace } from "@/app/components/topics/topic-workspace";

export const metadata: Metadata = { title: "Topics" };

export default function TopicsPage() {
  return (
    <ProductShell>
      <TopicWorkspace />
    </ProductShell>
  );
}

