import LogoFull from "../../../../public/cblogo.png";
import Image from "next/image";
import LoginForm from "@/app/ui/admin/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
      <section
        id="home"
        className="py-16 px-4 w-full h-screen bg-gray-50 border-b border-gray-200 flex justify-center"
      >
        <div className="container mx-auto w-[90%] justify-between grid grid-cols-2 items-center">
          <div className="">
            <Image
              src={LogoFull}
              alt="Logo"
              width={100}
              height={100}
              className="w-[200px] mb-4"
            />

            <h2 className="text-4xl font-bold mb-4 text-gray-800 w-[85%]">
              Selamat Datang di Dunia{" "}
              <span className="text-[#E37D2E]">Gula Kelapa</span> Alami
            </h2>
            <p className="text-gray-600 mb-6 text-lg w-[90%]">
              Jelajahi manfaat alami gula kelapa, pilihan terbaik untuk gaya
              hidup sehat Anda.
            </p>
          </div>
          <div className="flex justify-end">
            <LoginForm thisIsLogin={true} />
          </div>
        </div>
      </section>
  );
}