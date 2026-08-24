import type { Metadata } from "next";
import type { ReactNode } from "react";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import Sidebar from "@/components/Sidebar";

import {
  getAgents,
} from "@/lib/api";

import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "AI Autonomy Governor",
  description:
    "Govern, simulate, and optimize AI employee autonomy.",
};


export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {

  const agents =
    await getAgents();


  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >

      <body className="min-h-full bg-gray-50">

        <div className="flex min-h-screen flex-col lg:flex-row">

          <Sidebar
            agents={agents}
          />

          <div className="min-w-0 flex-1">
            {children}
          </div>

        </div>

      </body>

    </html>
  );
}