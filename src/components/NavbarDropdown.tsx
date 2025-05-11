"use client"

import { Menu, CircleUser } from "lucide-react";
import { useRouter } from "next/navigation";
import { logOut } from "../lib/session";

export default function Dropdown() {

    const router = useRouter()
    
    const handleClick = async () => {
        // if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        //     document.activeElement.blur();
        // }
        await logOut()
    };

    return (
        <div className="dropdown dropdown-end">
            <button tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                <Menu className="h-5 w-5" />
            </button>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-23">
                <li>
                    <a>
                        <CircleUser className="h-4 w-4 mr-0.5" />
                        Profile
                    </a>
                </li>
                <li>
                    <button onClick={handleClick} className="w-full text-left">Log Out</button>
                </li>
            </ul>
        </div>
    );
}