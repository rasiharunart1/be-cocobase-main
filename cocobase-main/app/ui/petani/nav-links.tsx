"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Icon from "@mdi/react";
import {
    mdiViewDashboardOutline,
    mdiAccountCircle,
} from "@mdi/js";

const links = [
    {
        name: "Dashboard",
        href: "/petani/dashboard",
        icon: mdiViewDashboardOutline
    },
    {
        name: "Profil Saya",
        href: "/petani/profile",
        icon: mdiAccountCircle,
    }
];

export default function PetaniNavLinks() {
    const pathname = usePathname();

    return (
        <>
            {links.map((link) => {
                return (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={clsx(
                            "flex h-[48px] md:w-[95%] md:mt-3 grow items-center justify-center gap-2 rounded-md p-3 text-sm font-medium hover:bg-[#00B69B] hover:text-white md:flex-none md:justify-start md:p-2 md:px-3 transition-colors",
                            {
                                "bg-[#00B69B] text-white": pathname === link.href,
                                "bg-white text-[#202224] border border-gray-100": pathname !== link.href,
                            }
                        )}
                    >
                        <Icon path={String(link.icon)} size={1.2} className="w-6" />
                        <p className="hidden md:block">{link.name}</p>
                    </Link>
                );
            })}
        </>
    );
}
