import { IBM_Plex_Sans_JP } from "next/font/google";

const ibmPlexSansJP = IBM_Plex_Sans_JP({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className={`${ibmPlexSansJP.variable} flex flex-1 flex-col items-center justify-center bg-white font-ibm-plex px-6 py-10`}
    >
      {children}
    </main>
  );
}
