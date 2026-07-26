import type { Metadata } from "next";
import { NotificationCenter } from "@/app/components/notifications/notification-center";
import { ProductShell } from "@/app/components/product-shell";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return <ProductShell><NotificationCenter /></ProductShell>;
}
