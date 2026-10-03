import { redirect } from "next/navigation";

export default function LegacyMockExamPage() {
  redirect("/scores");
}
