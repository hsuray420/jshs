import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "中投區國中升學資訊網",
  description: "提供中投區國中升學資訊、高中職與五專路徑、積分試算、落點參考與學校查詢。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
