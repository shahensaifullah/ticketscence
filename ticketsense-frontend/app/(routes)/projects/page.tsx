import type { Metadata } from "next";
import { ProductShell } from "@/app/components/product-shell";
import { ProjectList } from "@/app/components/projects/project-list";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <ProductShell>
      <ProjectList />
    </ProductShell>
  );
}
