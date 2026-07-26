import type { Metadata } from "next";
import { ProductShell } from "@/app/components/product-shell";
import { NewProjectForm } from "@/app/components/projects/project-form";

export const metadata: Metadata = { title: "Create project" };

export default function NewProjectPage() {
  return <ProductShell><NewProjectForm /></ProductShell>;
}
