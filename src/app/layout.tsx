import type { Metadata } from "next";
import { TRPCProvider } from "@/trpc/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Management",
  description: "A simple task management application",
};

// wraps the whole app with the trpc + react-query provider
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
