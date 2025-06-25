import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Embryo Predictor',
  description: 'Trabalho de Conclusão de Curso',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
