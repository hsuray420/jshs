import type { Metadata } from "next";
import "./globals.css";
import { AiAssistant } from "@/components/ai-assistant";
import { SiteIntroModal } from "@/components/site-intro-modal";
import { getMemberSession } from "@/lib/member-auth";

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
  openGraph: { type: "website", locale: "zh_TW", siteName: "全國國中升學資訊網", images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "JSHS 全國國中升學資訊網" }] },
  twitter: { card: "summary_large_image", images: ["/og-image.svg"] },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const member = await getMemberSession();
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
        <a className="jshs-skip-link" href="#main-content">跳到主要內容</a>
        <div id="main-content">{children}</div>
        <SiteIntroModal />
        <AiAssistant isMember={Boolean(member)} />
      </body>
    </html>
  );
}
