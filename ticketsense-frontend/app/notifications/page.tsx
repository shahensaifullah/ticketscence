import type { Metadata } from "next";
import { ProductShell } from "../components/product-shell";
import { NotificationCenter } from "./notification-center";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return <ProductShell><NotificationCenter /></ProductShell>;
}
