import type { Metadata } from "next";
import { poppins } from "@/app/ui/fonts";
import "../globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata: Metadata = {
    title: {
        template: "%s | Cocobase Farmer",
        default: "Cocobase Farmer",
    },
    description: "Farmer Dashboard for Packing Monitoring",
};

export default function PetaniLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${poppins.className} antialiased`}>
                <ToastContainer />
                {children}
            </body>
        </html>
    );
}
