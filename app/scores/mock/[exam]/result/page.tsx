import { redirect } from "next/navigation";

export default function LegacyMockResultPage() {
  redirect("/scores");
}
