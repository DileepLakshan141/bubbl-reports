import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto, Raleway } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { StoreProvider } from "../store/storeProvider";
import { Toaster } from "sonner";

const ralewayHeading = Raleway({
  subsets: ["latin"],
  variable: "--font-heading",
});

const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "bubbl - Team Workspace",
  description:
    "A team management application for efficient collaboration and productivity.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        roboto.variable,
        ralewayHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <StoreProvider>{children}</StoreProvider>
        <Toaster />
      </body>
    </html>
  );
}
