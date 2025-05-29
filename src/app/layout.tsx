import Footer from "../components/common/Footer";
import Navbar from "../components/common/Navbar";
import { decrypt } from "../lib/session";
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
      <body className="bg-base-200 pt-24">
        <Navbar session={session} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
