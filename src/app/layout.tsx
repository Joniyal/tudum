import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tudum - Collaborative Habit Tracker",
  description: "Track habits and goals with accountability partners",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
