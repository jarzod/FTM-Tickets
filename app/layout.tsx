import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Manrope } from "next/font/google"
import { AuthProvider } from "@/hooks/use-auth"
import { WorkspaceProvider } from "@/hooks/use-workspace"
import { EventsProvider } from "@/hooks/use-events"
import { RequestsProvider } from "@/hooks/use-requests"
import { PeopleProvider } from "@/hooks/use-people"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

export const metadata: Metadata = {
  title: "Ticket Manager",
  description: "Professional event management and ticketing system by Fresh Tape Media",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${manrope.variable} antialiased`}>
      <body className="font-sans">
        <AuthProvider>
          <WorkspaceProvider>
            <EventsProvider>
              <RequestsProvider>
                <PeopleProvider>{children}</PeopleProvider>
              </RequestsProvider>
            </EventsProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
