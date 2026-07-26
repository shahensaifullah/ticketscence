import type { Metadata } from "next";
import { BoardView } from "@/app/components/board/board-view";
import { ProductShell } from "@/app/components/product-shell";

export const metadata: Metadata = { title: "Board" };

export default function BoardPage() {
  return (
    <ProductShell>
      <BoardView />
    </ProductShell>
  );
}
