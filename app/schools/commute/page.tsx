import { redirect } from "next/navigation";

export default function CommuteRoute() {
  redirect("/schools?view=commute");
}

