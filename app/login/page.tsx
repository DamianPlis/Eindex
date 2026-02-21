import { redirect } from "next/navigation";
import LoginPanel from "@/components/auth/LoginPanel";
import { getSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");
  return <LoginPanel />;
}
