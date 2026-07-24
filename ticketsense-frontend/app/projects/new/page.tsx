import type { Metadata } from "next";
import { ProductShell } from "../../components/product-shell";
import { NewProjectForm } from "./project-form";

export const metadata: Metadata = { title: "Create project" };

export default function NewProjectPage() {
  return <ProductShell><NewProjectForm /></ProductShell>;
}
