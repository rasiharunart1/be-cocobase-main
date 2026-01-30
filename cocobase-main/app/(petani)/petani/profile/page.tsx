"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "@mdi/react";
import { mdiAccount, mdiLock, mdiArrowLeft, mdiContentSave } from "@mdi/js";
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
                toast.error("Session expired");
                router.push("/petani/login");
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/petani/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ nama, password }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success("Profile updated successfully");
                // Update local storage
                const newUser = { ...user, nama: data.data.nama };
                localStorage.setItem("petani_user", JSON.stringify(newUser));
                setUser(newUser);
                setPassword(""); // Clear password field
            } else {
                toast.error(data.message || "Update failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-green-600">Loading profile...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-green-600 text-white p-6 pb-24 rounded-b-[3rem] shadow-xl relative">
                <button
                    onClick={() => router.back()}
                    className="absolute top-6 left-6 bg-white/20 p-2 rounded-full hover:bg-white/30 transition"
                >
                    <Icon path={mdiArrowLeft} size={1} />
                </button>
                <div className="text-center pt-8">
                    <h1 className="text-2xl font-black">Edit Profile</h1>
                    <p className="text-green-100 text-sm">Update your account information</p>
                </div>
            </div>

            <div className="max-w-md mx-auto px-6 -mt-16">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Nama Petani</label>
                            <div className="relative">
                                <Icon path={mdiAccount} size={1} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    value={nama}
                                    onChange={(e) => setNama(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">New Password (Optional)</label>
                            <div className="relative">
                                <Icon path={mdiLock} size={1} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                                    placeholder="Leave blank to keep current"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-green-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Icon path={mdiContentSave} size={1} />
                            {loading ? "Saving..." : "Info Update"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
