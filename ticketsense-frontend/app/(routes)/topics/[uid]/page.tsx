import type { Metadata } from "next";
import { ProductShell } from "@/app/components/product-shell";
import { TopicWorkspace } from "@/app/components/topics/topic-workspace";

type TopicPageProps = {
  params: Promise<{ uid: string }>;
};

export const metadata: Metadata = { title: "Topic" };

export default async function TopicPage({ params }: TopicPageProps) {
  const { uid } = await params;

  return (
    <ProductShell>
      <TopicWorkspace initialTopicUid={decodeURIComponent(uid)} />
    </ProductShell>
  );
}

