import type { Metadata } from "next";
import { ProductShell } from "@/app/components/product-shell";
import { CreateTicketForm } from "@/app/components/tickets/create-ticket-form";

export const metadata: Metadata = { title: "Create Ticket" };

export default function NewTicketPage() {
  return (
    <ProductShell>
      <CreateTicketForm />
    </ProductShell>
  );
}
