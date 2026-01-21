import NavLinks from "@/app/ui/admin/nav-links";
import Logo from "../../../public/cblogo.png";
import FormSignOutNav from "@/app/ui/admin/signoutnav";
import Image from "next/image";
import Link from "next/link";

export default function SideNav() {
  return (
    <div className=" flex h-full flex-col px-3 py-4 md:px-2 bg-white shadow-md">
      <Link href="/admin" className="flex justify-center items-center">
        <Image src={Logo} alt="logo" width={150} height={50} className="" />
      </Link>
      <div className="flex grow flex-row justify-between md:mt-2 md:border-t-[1px] md:border-white items-end md:items-center space-x-2 bg-white md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-md bg-white md:block"></div>
        <FormSignOutNav />
      </div>
    </div>
  );
}
