import type { Metadata } from "next";
import { WorkspaceDashboardSummary } from "@/app/components/dashboard/workspace-dashboard-summary";
import { ProductShell } from "@/app/components/product-shell";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "TicketSense workspace overview.",
};

export default function DashboardPage() {
  return (
    <ProductShell>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1440px] space-y-6">
          <WorkspaceDashboardSummary />
        </div>
      </div>
    </ProductShell>
  );
}
