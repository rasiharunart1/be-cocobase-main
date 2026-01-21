import type { Metadata } from "next";
import { poppins } from "@/app/ui/fonts";
import "../../globals.css";
import SideNav from "@/app/ui/admin/sidenav";
import TopBar from "@/app/ui/admin/topBar";
import { ToastContainer } from 'react-toastify';

export const metadata: Metadata = {
  title: {
    template: "%s | Cocobase",
    default: "Cocobase",
  },
  description: "Cocobase Admin Panel",
  metadataBase: new URL("https://cocobase.vercel.app/"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.className}`}>
        <div className="flex h-screen bg-[#F2F2F2] flex-col md:flex-row md:overflow-hidden">
          {/* SideNav */}
          <ToastContainer />
          <div className="w-full flex-none md:w-64">
            <SideNav />
          </div>
          {/* Area Konten */}
          <div className="flex-grow flex flex-col md:overflow-y-auto relative">
            {/* TopBar dengan position: fixed, tetapi hanya di area konten */}
            <div className="fixed top-0 left-64 right-0 z-50 text-[#202224]">
              <TopBar />
            </div>
            {/* Konten children dengan padding untuk menghindari tumpang tindih dengan TopBar */}
            <div className="flex-grow md:pl-8 md:pt-20 mt-5 text-[#202224]">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}