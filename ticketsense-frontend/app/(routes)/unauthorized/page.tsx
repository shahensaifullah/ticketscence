import type { Metadata } from "next";
import Link from "next/link";
import { AuthActionPage } from "@/app/components/auth-action-page";

export const metadata: Metadata = { title: "Unauthorized" };

export default function UnauthorizedPage() {
  return <AuthActionPage description="Your current role does not have permission to view this resource. Contact a workspace administrator if you need access." icon="warning" title="Access restricted"><Link className="mt-6 block h-11 rounded-lg bg-[var(--primary-container)] py-3 text-sm font-semibold text-[var(--on-primary-container)]" href="/dashboard">Return to dashboard</Link></AuthActionPage>;
}
