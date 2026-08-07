import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "全國國中升學資訊網",
  description: "提供全國國中升學資訊、高中職與五專路徑、積分試算、落點參考與學校查詢。目前先開發中投區資料。",
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
      <body>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7151625151498067"
          crossOrigin="anonymous"
        />
        {children}
      </body>
    </html>
  );
}
