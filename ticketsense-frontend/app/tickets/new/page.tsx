import type { Metadata } from "next";
import { ProductShell } from "../../components/product-shell";
import { CreateTicketForm } from "./create-ticket-form";

export const metadata: Metadata = {
  title: "Create issue",
  description: "Create and classify a new TicketSense issue.",
};

export default function NewTicketPage() {
  return (
    <ProductShell activeSide="issues" activeTop="tickets">
      <CreateTicketForm />
    </ProductShell>
  );
}
