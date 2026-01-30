"use client";

import Icon from "@mdi/react";
import { mdiLogout } from "@mdi/js";

export default function LogoutButton() {
    const handleLogout = () => {
        document.cookie = "petani_token=; path=/; max-age=0";
        localStorage.removeItem("petani_user");
        window.location.href = "/petani/login";
    };

    return (
        <button
            onClick={handleLogout}
            className="flex h-[48px] md:w-[95%] grow items-center justify-center gap-2 rounded-md bg-white p-3 text-sm font-medium text-red-600 hover:bg-red-50 md:flex-none md:justify-start md:p-2 md:px-3 transition-colors mb-4"
        >
            <Icon path={mdiLogout} size={1.2} className="w-6" />
            <p className="hidden md:block">Keluar</p>
        </button>
    );
}
