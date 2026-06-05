import { IBM_Plex_Sans_JP } from "next/font/google";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/sidebar";
import { getSession } from "@/lib/auth/session";

const ibmPlexSansJP = IBM_Plex_Sans_JP({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className={`${ibmPlexSansJP.variable} min-h-screen bg-white`}>
      <AdminShell role={session.role}>{children}</AdminShell>
    </div>
  );
}
