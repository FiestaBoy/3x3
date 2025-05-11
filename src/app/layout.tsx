import Navbar from "../components/Navbar";
import { decrypt } from "../lib/session";
import "./globals.css";
import { cookies } from "next/headers";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = (await cookies()).get("session")?.value
  const cookie = token ? await decrypt(token) : null
  return (
    <html lang="en">
      <head></head>
      <body>
        <Navbar session={cookie?.userId ? cookie : null}/>
        {children}
      </body>
    </html>
  );
}
