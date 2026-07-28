import type { Metadata } from "next";
import { MyWorkView } from "@/app/components/my-work/my-work-view";
import { ProductShell } from "@/app/components/product-shell";

export const metadata: Metadata = { title: "My Work" };

export default function MyWorkPage() {
  return (
    <ProductShell>
      <MyWorkView />
    </ProductShell>
  );
}
