import type { Metadata } from "next";
import { ProductShell } from "../components/product-shell";
import { TicketList } from "./ticket-list";

export const metadata: Metadata = {
  title: "Tickets",
  description: "Search, filter, and manage all support tickets.",
};

export default function TicketsPage() {
  return (
    <ProductShell activeSide="issues" activeTop="tickets">
      <TicketList />
    </ProductShell>
  );
}
