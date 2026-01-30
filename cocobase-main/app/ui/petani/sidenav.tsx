import PetaniNavLinks from "@/app/ui/petani/nav-links";
import Logo from "../../../public/cblogo.png";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "@/app/ui/petani/logout-button";

export default function PetaniSideNav() {
    return (
        <div className="flex h-full flex-col px-3 py-4 md:px-2 bg-white shadow-md border-r">
            <Link href="/petani/dashboard" className="flex justify-center items-center mb-6">
                <Image src={Logo} alt="logo" width={150} height={50} priority />
            </Link>
            <div className="flex grow flex-row justify-between md:mt-2 md:border-t-[1px] md:border-gray-100 items-end md:items-center space-x-2 bg-white md:flex-col md:space-x-0 md:space-y-2">
                <PetaniNavLinks />
                <div className="hidden h-auto w-full grow rounded-md bg-white md:block"></div>

                <LogoutButton />
            </div>
        </div>
    );
}
