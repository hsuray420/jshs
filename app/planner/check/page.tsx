import { redirect } from "next/navigation";

export default function PlannerCheckCompatibilityRoute() {
  redirect("/planner/custom?panel=health-check");
}
