import './globals.css'
import type { Metadata } from 'next'
import React from 'react';
import { AppProvider } from '@/contexts/AppContext';

export const metadata: Metadata = {
  title: 'Client Management System'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
} 