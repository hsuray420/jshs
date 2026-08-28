import { redirect } from "next/navigation";

export default function CostRoute() {
  redirect("/schools?view=cost");
}

