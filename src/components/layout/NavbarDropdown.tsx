"use client";

import { useRouter } from "next/navigation";
import { Menu, CircleUser, LogOut } from "lucide-react";
import { logOut } from "../../lib/db/auth/session";
import Link from "next/link";

export default function Dropdown() {
  const handleClick = async () => {
    await logOut();
  };

  return (
    <div className="dropdown dropdown-end">
      <button
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle hover:bg-primary hover:text-primary-content transition-all"
      >
        <Menu className="h-5 w-5" />
      </button>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content mt-3 z-[1] p-3 shadow-xl bg-base-100 rounded-box w-52 border border-base-300"
      >
        <li>
          <Link
            href="/profile"
            className="hover:bg-primary hover:text-primary-content transition-all py-3 rounded-lg"
          >
            <CircleUser className="h-5 w-5" />
            <span className="text-base">Profile</span>
          </Link>
        </li>
        <div className="divider my-1"></div>
        <li>
          <button
            onClick={handleClick}
            className="w-full text-left hover:bg-error hover:text-error-content transition-all py-3 rounded-lg"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-base">Log Out</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
