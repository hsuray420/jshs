import { redirect } from "next/navigation";

export default function SchoolHistoryRoute() {
  redirect("/schools?view=history");
}

