import { redirect } from "next/navigation";

export default function SchoolCompareRedirect() {
  redirect("/schools?view=compare");
}
