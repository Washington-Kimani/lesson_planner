import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import {ThemeProvider} from "next-themes";
import "./globals.css";


export const metadata: Metadata = {
  title: "Lesson Planner",
  description: "",
};

const jakarta = Plus_Jakarta_Sans({subsets: ["main"], variable: "--font-jakarta"})

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
      <ThemeProvider attribute={"class"} defaultTheme={"system"} enableSyste disableTransitionOnChange>
        {children}
      </ThemeProvider>
      </body>
    </html>
  );
}
