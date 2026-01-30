"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Icon from "@mdi/react";
import { mdiAccountKey, mdiLock, mdiSprout } from "@mdi/js";

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
                // Store token in cookie or local storage
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
        <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-green-600 p-8 text-center">
                    <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Icon path={mdiSprout} size={2} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Petani Login</h1>
                    <p className="text-green-100 text-sm mt-1">Access your packing performance dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nama Petani</label>
                        <div className="relative">
                            <Icon path={mdiAccountKey} size={1} className="absolute left-3 top-3 text-gray-400" />
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
                        <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <Icon path={mdiLock} size={1} className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-green-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? "Logging in..." : "LOGIN TO DASHBOARD"}
                    </button>

                    <div className="text-center text-xs text-gray-400 mt-4">
                        Forgot password? Contact admin to reset.
                    </div>
                </form>
            </div>
        </div>
    );
}
