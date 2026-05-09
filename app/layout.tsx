import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JSON Chat Reader",
  description: "View and browse AI chat session logs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
