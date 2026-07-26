import type { Metadata } from "next";
import { ProductShell } from "@/app/components/product-shell";
import { TicketDetail } from "@/app/components/tickets/ticket-detail";

type TicketPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: TicketPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: id.toUpperCase(),
    description: `View and manage ticket ${id.toUpperCase()}.`,
  };
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;

  return (
    <ProductShell activeSide="issues" activeTop="tickets">
      <TicketDetail id={decodeURIComponent(id).toUpperCase()} />
    </ProductShell>
  );
}
