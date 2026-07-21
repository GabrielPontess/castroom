import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Castroom",
  description: "MVP local de videoaulas em tempo real com LiveKit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
