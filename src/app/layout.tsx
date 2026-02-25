import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SalonPro - Sistema de Gestão para Salões de Beleza",
  description: "Sistema completo SaaS para gestão de salões de beleza. Agendamentos, clientes, profissionais, financeiro e muito mais.",
  keywords: ["salão de beleza", "gestão", "agendamentos", "SaaS", "sistema", "barbearia", "clínica estética"],
  authors: [{ name: "SalonPro" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✂️</text></svg>",
  },
  openGraph: {
    title: "SalonPro - Sistema de Gestão para Salões",
    description: "Sistema completo para gestão de salões de beleza",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
