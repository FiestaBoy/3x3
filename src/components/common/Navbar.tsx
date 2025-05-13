"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import ThemeController from "./ThemeController";
import { SessionPayload } from "../../lib/session";
import Dropdown from "./NavbarDropdown";

type NavbarProps = {
  session: SessionPayload | null;
};

export default function Navbar({ session }: NavbarProps) {
  return (
    <div className="navbar fixed top-0 left-0 right-0 z-50 bg-base-100">
      {session ? (
        <>
          <div className="flex-1">
            <Link href="/" className="btn btn-ghost text-xl">
              3x3
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <ThemeController />
            <Link href="/tournaments" className="btn btn-ghost text-xl">
              Tournaments
            </Link>
            <Dropdown />
          </div>
        </>
      ) : (
        <>
          <div className="flex-1">
            <Link href="/" className="btn btn-ghost text-xl">
              3x3
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <ThemeController />
            <Link href="/tournaments" className="btn btn-square btn-ghost">
              <Search />
            </Link>
            <Link href="/auth/login" className="btn btn-ghost text-xl">
              Login
            </Link>
            <Link href="/auth/signup" className="btn btn-ghost text-xl">
              SignUp
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
