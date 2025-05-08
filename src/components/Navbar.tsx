import Link from "next/link";

import { Search } from "lucide-react";
import ThemeController from "./ThemeController";

export default function Navbar() {
  return (
    <div className="navbar fixed top-0 left-0 right-0 z-50 bg-base-100">
      <div className="flex-1">
        <Link href="/" className="btn btn-ghost text-xl">
          3x3
        </Link>
      </div>
      <div className="flex items-center gap-1">
        <ThemeController />
        <Link href="/search/tournaments" className="btn btn-square btn-ghost">
          <Search />
        </Link>
        <Link href="/auth/login" className="btn btn-ghost text-xl">
          Login
        </Link>
        <Link href="/auth/signup" className="btn btn-ghost text-xl">
          SignUp
        </Link>
      </div>
    </div>
  );
}
