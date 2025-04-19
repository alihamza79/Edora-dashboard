import React from "react";
import { Providers } from "@/store/providers";
import MyApp from './app';
import "./global.css";


export const metadata = {
  title: 'WebComp Learning Platform',
  description: 'Advanced web development learning platform',
  icons: {
    icon: '/newlogo.png',
    apple: '/newlogo.png',
    shortcut: '/newlogo.png'
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <MyApp>{children}</MyApp>
        </Providers>
      </body>
    </html>
  );
}


