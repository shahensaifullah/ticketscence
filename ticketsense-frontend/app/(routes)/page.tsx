import type { Metadata } from "next";
import { LandingPage } from "@/app/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "AI issue management for modern teams",
  description:
    "Turn support signals into prioritized work with AI triage, multi-workspace management, role-based teams, and operational clarity.",
};

export default function HomePage() {
  return <LandingPage />;
}
