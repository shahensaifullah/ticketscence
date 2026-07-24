import type { Metadata } from "next";
import { ProductShell } from "../components/product-shell";
import { BoardView } from "./board-view";

export const metadata: Metadata = { title: "Board" };

export default function BoardPage() {
  return (
    <ProductShell>
      <BoardView />
    </ProductShell>
  );
}
