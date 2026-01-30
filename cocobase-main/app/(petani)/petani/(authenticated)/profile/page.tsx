"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "@mdi/react";
import { mdiAccount, mdiLock, mdiContentSave } from "@mdi/js";
import { toast } from "react-toastify";

export default function PetaniProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [nama, setNama] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const userData = localStorage.getItem("petani_user");
        if (!userData) {
            router.push("/petani/login");
            return;
        }
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setNama(parsedUser.nama);
    }, []);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = getCookie("petani_token");
            if (!token) {
                toast.error("Sesi telah berakhir");
                router.push("/petani/login");
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/petani/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ nama: nama.trim(), password }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success("Profil berhasil diperbarui");
                const newUser = { ...user, nama: data.data.nama };
                localStorage.setItem("petani_user", JSON.stringify(newUser));
                setUser(newUser);
                setPassword("");
            } else {
                toast.error(data.message || "Gagal memperbarui profil");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="p-8 text-[#00B69B] font-medium">Memuat profil...</div>;

    return (
        <div className="mr-5 md:mr-8 mb-5 md:mb-8">
            <h1 className="text-3xl font-bold tracking-wide mb-8">Pengaturan Profil</h1>

            <div className="max-w-xl">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div>
                            <label className="mb-2 block text-xs font-semibold text-gray-700">Nama Petani</label>
                            <div className="relative">
                                <Icon path={mdiAccount} size={0.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={nama}
                                    onChange={(e) => setNama(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-[#00B69B] outline-none transition-colors text-sm"
                                    placeholder="Masukkan nama Anda"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold text-gray-700">Password Baru (Opsional)</label>
                            <div className="relative">
                                <Icon path={mdiLock} size={0.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-[#00B69B] outline-none transition-colors text-sm"
                                    placeholder="Kosongkan jika tidak ingin mengubah"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full md:w-auto px-10 bg-[#00B69B] hover:bg-[#009e86] text-white font-bold py-3 rounded-lg transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Icon path={mdiContentSave} size={0.8} />
                                {loading ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
