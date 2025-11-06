import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import { decrypt } from "../lib/db/auth/session";
import "./globals.css";
import { cookies } from "next/headers";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = (await cookies()).get("session")?.value;
  const session = token ? await decrypt(token) : null;
  return (
    <html lang="en">
      <head></head>
      <body className="min-h-screen">
        <Navbar session={session} />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
