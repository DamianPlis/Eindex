"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch {
      // noop
    }
    await fetch("/api/session", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button className="ghost-button" onClick={handleLogout}>
      Logout
    </button>
  );
}
