import { redirect } from "next/navigation";

export default function LegacyMockHistoryPage() {
  redirect("/scores");
}
