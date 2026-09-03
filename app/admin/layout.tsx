import { AdminShell } from "../../components/admin-shell";
import "./styles.css";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}
