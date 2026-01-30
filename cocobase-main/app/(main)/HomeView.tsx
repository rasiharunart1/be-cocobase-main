"use client"; // Marking this as client just in case, or keep it server if possible. 
// Actually, let's keep it server compatible if we can, but if lazy used, maybe just good to be separate.
// But lazy() works in SC? Actually lazy() is primarily for client bundle splitting.
// In Next.js App Router, dynamic imports `import(...)` are preferred.
// Let's just copy exactly as is for now, but remove metadata.

import Image from "next/image";
import Link from "next/link";
import { Suspense, lazy } from "react";
import { SkeletonCard } from "@/app/ui/admin/skeleton/card";
import Icon from "@mdi/react";
import { mdiWhatsapp } from "@mdi/js";
import imageHome from "@/public/home.png";
import imageNderes from "@/public/nderes.png";
import imageWajan from "@/public/wajan.png";

const CardArtikel = lazy(() => import("@/app/ui/admin/cocoblog/cardMain"));
const CardShop = lazy(() => import("@/app/ui/admin/produk/cardMain"));

export default function HomeView({
    search,
    currentPage,
    limit,
}: {
    search: string;
    currentPage: number;
    limit: number;
}) {
    return (
        <main className="mt-10">
            <Chat />
            <Home />
            <About />
            <Benefits />
            <Shop currentPage={currentPage} search={search} limit={limit} />
            <Cocoblog currentPage={currentPage} search={search} limit={limit} />
            <Footer />
        </main>
    );
}

export const Chat = () => {
    const nomorTujuan = 6285727055150;
    const linkToWA = `https://api.whatsapp.com/send?phone=${nomorTujuan}&text=Halo%20saya%20ingin%20bertanya%20mengenai%20Cocobase%2C%20`;

    return (
        <div className="peer fixed bottom-0 right-0 m-10 bg-green-500 text-white p-2 rounded-full shadow-md hover:bg-green-700 transition duration-300">
            <Link
                href={linkToWA}
                target="_blank"
                rel="noopener noreferrer"
                className="peer"
            >
                <Icon path={mdiWhatsapp} size={1.5} color="white" />
            </Link>
            <p className="invisible peer-hover:visible absolute -top-10 right-0 bg-gray-800 text-white p-2 rounded text-sm whitespace-nowrap transition-all duration-300 transform translate-y-2 peer-hover:translate-y-0">
                Hubungi Kami di WhatsApp
            </p>
        </div>
    );
};

const Home = () => {
    return (
        <section
            id="home"
            className="py-16 px-4 bg-gray-50 border-b border-gray-200 flex justify-center"
        >
            <div className="container mx-auto w-[90%] justify-between grid grid-cols-2 items-center">
                <div className="">
                    <h2 className="text-4xl font-bold mb-4 text-gray-800 w-[85%]">
                        Selamat Datang di Dunia{" "}
                        <span className="text-[#E37D2E]">Gula Kelapa</span> Alami
                    </h2>
                    <p className="text-gray-600 mb-6 text-lg w-[90%]">
                        Jelajahi manfaat alami gula kelapa, pilihan terbaik untuk gaya hidup
                        sehat Anda.
                    </p>
                    <Link
                        href={"#about"}
                        className="bg-[#E37D2E] text-white px-6 py-3 rounded-lg shadow hover:bg-[#bb6727] transition duration-300"
                    >
                        Jelajahi
                    </Link>
                </div>
                <div className="">
                    <Image
                        src={imageHome}
                        alt="logo"
                        width={1000}
                        height={638}
                        className="w-full h-full"
                    />
                </div>
            </div>
        </section>
    );
};

const About = () => {
    return (
        <section
            id="about"
            className="py-16 px-4 border-b border-gray-200 flex items-center bg-[#f7ceb0]"
        >
            <div className="container mx-auto text-center w-[90%]">
                <h2 className="text-4xl font-extrabold mb-4 text-gray-800">
                    Mengenal Gula Kelapa Lebih Dekat
                </h2>
                <p className="text-gray-600 mb-6 text-lg">
                    Kami hadir untuk memberikan Anda gula kelapa terbaik, diproduksi
                    secara alami dan ramah lingkungan.
                </p>
                <div className="flex w-full gap-3">
                    <div className="w-full">
                        <Image
                            src={"https://images.unsplash.com/photo-1537191072641-5e19cc173c6a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Y29jb251dCUyMHRyZWV8ZW58MHx8MHx8fDA%3D"}
                            alt="logo"
                            width={400}
                            height={400}
                            className="w-full rounded-xl shadow mb-3 h-24 object-cover"
                        />
                        <Image
                            src={"https://images.unsplash.com/photo-1564490292125-2e3c78a0ef44?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y29jb251dCUyMHRyZWV8ZW58MHx8MHx8fDA%3D"}
                            alt="logo"
                            width={400}
                            height={400}
                            className="w-full rounded-xl shadow h-96 object-cover"
                        />
                    </div>
                    <div className="w-full">
                        <Image
                            src={imageNderes}
                            alt="logo"
                            width={400}
                            height={400}
                            className="w-full rounded-xl shadow mb-3 h-60 object-cover"
                        />
                        <Image
                            src={imageWajan}
                            alt="logo"
                            width={400}
                            height={400}
                            className="w-full rounded-xl shadow h-60 object-cover"
                        />
                    </div>
                    <div className="w-full">
                        <Image
                            src={"https://ik.imagekit.io/fathpurn/1738310211934_D_neDuDfC.jpg"}
                            alt="logo"
                            width={400}
                            height={400}
                            className="w-full rounded-xl shadow mb-3 h-96 object-cover"
                        />
                        <Image
                            src={"https://ik.imagekit.io/fathpurn/1738310930980_zXwOX2EjC.jpg"}
                            alt="logo"
                            width={400}
                            height={400}
                            className="w-full rounded-xl shadow h-24 object-cover"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

const Benefits = () => {
    return (
        <section
            id="benefits"
            className="py-16 px-4 bg-gray-50 border-b border-gray-200"
        >
            <div className="container mx-auto text-center">
                <h2 className="text-4xl font-extrabold mb-4 text-gray-800">
                    Manfaat Gula Kelapa
                </h2>
                <p className="text-gray-600 mb-6 text-lg">
                    Gula kelapa memiliki banyak manfaat yang baik untuk kesehatan dan
                    lingkungan.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 text-left mx-auto max-w-3xl">
                    <div className="flex items-start bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500 hover:bg-green-100 focus:bg-green-200 hover:scale-105 transition duration-300">
                        <h3 className="text-green-500 mr-2 font-semibold w-[30%]">
                            1. Indeks Glikemik Rendah
                        </h3>
                        <p className="ml-4 text-gray-600 w-[70%]">
                            Ramah untuk penderita diabetes.
                        </p>
                    </div>
                    <div className="flex items-start bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500 hover:bg-yellow-100 focus:bg-yellow-200 hover:scale-105 transition duration-300">
                        <span className="text-yellow-500 mr-2 font-semibold w-[30%]">
                            2. Kaya Nutrisi
                        </span>
                        <p className="ml-4 text-gray-600 w-[70%]">
                            Mengandung mineral seperti Zinc, Magnesium, dan Kalium.
                        </p>
                    </div>
                    <div className="flex items-start bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500 hover:bg-blue-100 focus:bg-blue-200 hover:scale-105 transition duration-300">
                        <span className="text-blue-500 mr-2 font-semibold  w-[30%]">
                            3. Sumber Energi Alami
                        </span>
                        <p className="ml-4 text-gray-600 w-[70%]">
                            Energi yang tahan lama tanpa lonjakan gula darah.
                        </p>
                    </div>
                    <div className="flex items-start bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500 hover:bg-red-100 focus:bg-red-200 hover:scale-105 transition duration-300">
                        <span className="text-red-500 mr-2 font-semibold  w-[30%]">
                            4. Ramah Lingkungan
                        </span>
                        <p className="ml-4 text-gray-600 w-[70%]">
                            Diproduksi secara berkelanjutan.
                        </p>
                    </div>
                    <div className="flex items-start bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500 hover:bg-purple-100 focus:bg-purple-200 hover:scale-105 transition duration-300">
                        <span className="text-purple-500 mr-2 font-semibold  w-[30%]">
                            5. Alternatif Gula yang Sehat
                        </span>
                        <p className="ml-4 text-gray-600 w-[70%]">
                            Bebas bahan kimia tambahan.
                        </p>
                    </div>
                    <div className="flex items-start bg-white p-4 rounded-lg shadow-md border-l-4 border-pink-500 hover:bg-pink-100 focus:bg-pink-200 hover:scale-105 transition duration-300">
                        <span className="text-pink-500 mr-2 font-semibold  w-[30%]">
                            6. Cocok untuk Diet
                        </span>
                        <p className="ml-4 text-gray-600 w-[70%]">
                            Kandungan kalori lebih rendah.
                        </p>
                    </div>
                    <div className="flex items-start bg-white p-4 rounded-lg shadow-md border-l-4 border-orange-500 hover:bg-orange-100 focus:bg-orange-200 hover:scale-105 transition duration-300">
                        <span className="text-orange-500 mr-2 font-semibold  w-[30%]">
                            7. Rasa Karamel Alami
                        </span>
                        <p className="ml-4 text-gray-600 w-[70%]">
                            Rasa khas yang lembut dan manis.
                        </p>
                    </div>
                    <div className="flex items-start bg-white p-4 rounded-lg shadow-md border-l-4 border-teal-500 hover:bg-teal-100 focus:bg-teal-200 hover:scale-105 transition duration-300">
                        <span className="text-teal-500 mr-2 font-semibold w-[30%]">
                            8. Sumber Antioksidan
                        </span>
                        <p className="ml-4 text-gray-600 w-[70%]">
                            Mencegah penuaan dini dan penyakit kronis.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

const Shop = ({
    currentPage,
    limit,
    search,
}: {
    limit: number;
    currentPage: number;
    search: string;
}) => {
    return (
        <section
            id="shop"
            className="py-16 px-4 bg-[#E37D2E] border-b border-gray-200"
        >
            <div className="container mx-auto text-center">
                <h2 className="text-4xl font-extrabold mb-4 text-white">
                    Temukan Produk Gula Kelapa Pilihan Kami
                </h2>
                <p className="text-gray-200 mb-6 text-lg">
                    Jelajahi produk gula kelapa berkualitas tinggi yang siap melengkapi
                    kebutuhan dapur Anda.
                </p>
                <Suspense fallback={<SkeletonCard />}>
                    <CardShop currentPage={currentPage} search={search} limit={limit} />
                </Suspense>
                <div className="mt-10">
                    <Link
                        href={"/produk"}
                        className="mt-3 bg-gray-50 text-[#a35c25] px-6 py-3 rounded-lg shadow hover:bg-gray-200 transition duration-300"
                    >
                        Produk Lainnya
                    </Link>
                </div>
            </div>
        </section>
    );
};

const Cocoblog = ({
    currentPage,
    limit,
    search,
}: {
    limit: number;
    currentPage: number;
    search: string;
}) => {
    return (
        <section
            id="blog"
            className="py-16 px-4 bg-gray-50 border-b border-gray-200"
        >
            <div className="container mx-auto text-center w-[90%]">
                <h2 className="text-4xl font-extrabold mb-4 text-gray-800">
                    Wawasan & Inspirasi tentang Gula Kelapa
                </h2>
                <p className="text-gray-600 mb-6 text-lg">
                    Dapatkan informasi menarik, resep, dan tren terkini seputar gula
                    kelapa.
                </p>
                {/* card atas */}
                <Suspense fallback={<SkeletonCard />}>
                    <CardArtikel
                        currentPage={currentPage}
                        search={search}
                        limit={limit}
                    />
                </Suspense>
                <div className="mt-10">
                    <Link
                        href={"/cocoblog"}
                        className="bg-[#E37D2E] relative  text-white px-6 py-3 rounded-lg shadow hover:bg-[#c47438] transition duration-300"
                    >
                        Artikel lain
                    </Link>
                </div>
            </div>
        </section>
    );
};

export const Footer = () => {
    return (
        <footer id="footer" className="py-4 bg-gray-800 text-white text-center">
            <p>&copy; {new Date().getFullYear()} Cocobase. Semua hak dilindungi.</p>
        </footer>
    );
};
