import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "找學校｜全國國中升學資訊網", robots: { index: false, follow: false } };

export default function OpenDaysRoute() { redirect("/schools"); }
