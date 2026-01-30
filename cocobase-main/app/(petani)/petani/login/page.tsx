"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Icon from "@mdi/react";
import { mdiAccount, mdiLock } from "@mdi/js";
import Image from "next/image";
import LogoFull from "../../../../public/cblogo.png";

export default function PetaniLoginPage() {
    const [nama, setNama] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/petani/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nama, password }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success("Login successful");
                document.cookie = `petani_token=${data.data.token}; path=/; max-age=604800; SameSite=Strict`;
                localStorage.setItem("petani_user", JSON.stringify(data.data.user));
                router.push("/petani/dashboard");
            } else {
                toast.error(data.message || "Login failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section
            id="home"
            className="py-16 px-4 w-full h-screen bg-gray-50 border-b border-gray-200 flex justify-center items-center"
        >
            <div className="container mx-auto w-[90%] justify-between grid grid-cols-1 md:grid-cols-2 items-center gap-8">
                <div className="hidden md:block">
                    <Image
                        src={LogoFull}
                        alt="Logo"
                        width={100}
                        height={100}
                        className="w-[200px] mb-4"
                    />

                    <h2 className="text-4xl font-bold mb-4 text-gray-800 w-[85%]">
                        Portal Petani <span className="text-[#E37D2E]">Cocobase</span>
                    </h2>
                    <p className="text-gray-600 mb-6 text-lg w-[90%]">
                        Pantau performa packing Anda secara real-time dan kelola hasil produksi gula kelapa alami dengan mudah.
                    </p>
                </div>

                <div className="flex justify-center md:justify-end">
                    <form onSubmit={handleLogin} className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md space-y-6">
                        <div className="md:hidden mb-6 flex justify-center">
                            <Image
                                src={LogoFull}
                                alt="Logo"
                                width={150}
                                height={50}
                            />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Login Petani</h1>
                            <p className="text-gray-500 text-sm mt-1">Gunakan nama dan password Anda</p>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-medium text-gray-900" htmlFor="nama">
                                Nama Petani
                            </label>
                            <div className="relative">
                                <Icon path={mdiAccount} size={0.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    className="peer block w-full rounded-md border border-gray-200 py-[12px] pl-10 text-sm outline-none focus:border-[#E37D2E] transition-colors placeholder:text-gray-500"
                                    id="nama"
                                    type="text"
                                    value={nama}
                                    onChange={(e) => setNama(e.target.value)}
                                    placeholder="Masukkan nama Anda"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-medium text-gray-900" htmlFor="password">
                                Password
                            </label>
                            <div className="relative">
                                <Icon path={mdiLock} size={0.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    className="peer block w-full rounded-md border border-gray-200 py-[12px] pl-10 text-sm outline-none focus:border-[#E37D2E] transition-colors placeholder:text-gray-500"
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#E37D2E] hover:bg-[#bb6727] text-white font-bold py-3 rounded-lg transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? "MEMPROSES..." : "LOG IN"}
                            {!loading && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>

                        <div className="text-center text-xs text-gray-400 mt-4">
                            Lupa password? Silakan hubungi admin.
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}

