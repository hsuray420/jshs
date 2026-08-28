import { redirect } from "next/navigation";

export default function SchoolMapRoute() {
  redirect("/schools?view=map");
}

