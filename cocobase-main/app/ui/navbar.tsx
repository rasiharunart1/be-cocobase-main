import Navlink from "@/app/ui/navlink";
import Logo from "@/public/cblogo.png";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="flex justify-center w-full bg-white fixed bottom-0 md:bottom-auto z-50 shadow-md md:top-0">
      <div className="w-full md:w-[95%] md:flex md:flex-row md:justify-between items-center">
        <Link href={"/"}>
          <Image src={Logo} alt="logo" width={150} height={50} className="" />
        </Link>
        <div className="flex flex-row justify-end md:gap-2">
          <Navlink />
        </div>
      </div>
    </div>
  );
}
