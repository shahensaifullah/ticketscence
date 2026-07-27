import { ProductShell } from "@/app/components/product-shell";
import { ProjectOverview } from "@/app/components/projects/project-overview";

export default async function ProjectPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;

  return (
    <ProductShell>
      <ProjectOverview projectKey={decodeURIComponent(key)} />
    </ProductShell>
  );
}
