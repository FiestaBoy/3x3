"use client";

import Link from "next/link";
import { Search, Trophy } from "lucide-react";
import ThemeController from "./ThemeController";
import { SessionPayload } from "../../lib/session";
import Dropdown from "./NavbarDropdown";

type NavbarProps = {
  session: SessionPayload | null;
};

export default function Navbar({ session }: NavbarProps) {
  return (
    <div className="navbar fixed top-0 left-0 right-0 z-50 bg-base-100 shadow-lg backdrop-blur-sm bg-opacity-95">
      {session ? (
        <>
          <div className="flex-1">
            <Link href="/" className="btn btn-ghost text-xl font-bold">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                3x3
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeController />
            <Link
              href="/tournaments"
              className="btn btn-ghost text-base hover:bg-primary hover:text-primary-content transition-all"
            >
              Tournaments
            </Link>
            <Link
              href="/teams/my-teams"
              className="btn btn-ghost text-base hover:bg-secondary hover:text-secondary-content transition-all"
            >
              My Teams
            </Link>
            <Dropdown />
          </div>
        </>
      ) : (
        <>
          <div className="flex-1">
            <Link href="/" className="btn btn-ghost text-xl font-bold">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                3x3
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeController />
            <Link
              href="/auth/login"
              className="btn btn-ghost text-base hover:bg-primary hover:text-primary-content transition-all"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="btn btn-primary text-base shadow-lg hover:shadow-xl transition-all"
            >
              Sign Up
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
