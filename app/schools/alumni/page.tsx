import { redirect } from "next/navigation";

export default function AlumniRoute() {
  redirect("/schools?view=alumni");
}

