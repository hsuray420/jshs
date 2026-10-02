import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "探索學校｜全國國中升學資訊網", description: "依就學區、縣市、公私立、學制與科別探索高中職。", alternates: { canonical: "/schools" } };

export default function SchoolExplorePage() {
  redirect("/schools");
}
