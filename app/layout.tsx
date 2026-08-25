import type { Metadata } from "next";
import "./globals.css";
import { AiAssistant } from "@/components/ai-assistant";

const googleTagId = "G-Y9298RKYMZ";

export const metadata: Metadata = {
  metadataBase: new URL("https://jshs.cc"),
  title: "全國國中升學資訊網",
  description: "全國國中升學資訊：全區學校查詢、積分試算、志願分析與高中職、五專升學路徑。",
  themeColor: "#F2F2F7",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleTagId}');
            `,
          }}
        />
      </head>
      <body>
        {children}
        <AiAssistant />
      </body>
    </html>
  );
}
