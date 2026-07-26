import type { Metadata } from "next";
import { ProductShell } from "@/app/components/product-shell";
import { TeamWorkspace } from "@/app/components/team/team-workspace";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return (
    <ProductShell>
      <TeamWorkspace />
    </ProductShell>
  );
}
