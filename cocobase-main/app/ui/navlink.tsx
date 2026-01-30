'use client'
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";


const links = [
  { name: "Beranda", href: "/" },

  { name: "Cocoblog", href: "/cocoblog" },
  { name: "Login Petani", href: "/petani/login" },
  { name: "Login Admin", href: "/auth/login" },
  { name: "Register Admin", href: "/auth/register" },
];

export default function Navlink() {
  const pathname = usePathname();
  const pathArray = pathname.split("/");
  const newPathname = pathArray.slice(0, 3).join("/");

  return (
    <>
      {links.map((link) => {
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              "flex h-[48px] grow items-center justify-center gap-2 bg-white p-3 text-sm font-medium hover:text-[#E37D2E] md:flex-none md:justify-start md:p-2 md:px-3",
              {
                "text-[#E37D2E] font-medium": newPathname === link.href,
                "text-gray-900": newPathname !== link.href,
              }
            )}
          >
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}