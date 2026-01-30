"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@mdi/react";
import { mdiWeightKilogram, mdiPackageVariantClosed, mdiTrophy, mdiHistory, mdiLogout, mdiAccountCircle } from "@mdi/js";

export default function PetaniDashboard() {
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const userData = localStorage.getItem("petani_user");
        if (!userData) {
            router.push("/petani/login");
            return;
        }
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchStats(parsedUser.id);
    }, []);

    const fetchStats = async (id: number) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/statistics/petani/${id}`);
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleLogout = () => {
        document.cookie = "petani_token=; path=/; max-age=0";
        localStorage.removeItem("petani_user");
        router.push("/petani/login");
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-green-600">Loading dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-green-600 text-white p-6 pb-24 rounded-b-[3rem] shadow-xl">
                <div className="flex justify-between items-center max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link href="/petani/profile" className="flex items-center gap-3 hover:opacity-80 transition group">
                            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition">
                                <Icon path={mdiAccountCircle} size={1.5} />
                            </div>
                            <div>
                                <p className="text-green-100 text-xs uppercase font-bold tracking-wider">Welcome back,</p>
                                <h1 className="text-2xl font-black underline decoration-green-400/50 underline-offset-4 decoration-2">{user?.nama}</h1>
                            </div>
                        </Link>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition backdrop-blur-md"
                    >
                        <Icon path={mdiLogout} size={1} />
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 -mt-16">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total Production</p>
                            <h3 className="text-3xl font-black text-gray-800">
                                {stats?.totalWeight?.toFixed(1) || "0.0"} <span className="text-lg font-light text-gray-400">kg</span>
                            </h3>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-xl text-blue-500">
                            <Icon path={mdiWeightKilogram} size={1.5} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total Packed</p>
                            <h3 className="text-3xl font-black text-gray-800">
                                {stats?.totalPacking || "0"} <span className="text-lg font-light text-gray-400">units</span>
                            </h3>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-xl text-purple-500">
                            <Icon path={mdiPackageVariantClosed} size={1.5} />
                        </div>
                    </div>
                </div>

                {/* Performance Summary */}
                <div className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl shadow-lg p-6 text-white mb-8 flex items-center justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="font-medium text-orange-100 mb-1">Average Performance</p>
                        <h3 className="text-2xl font-bold">
                            {stats?.averageWeight?.toFixed(2) || "0.00"} kg <span className="text-sm font-normal text-orange-100">/ pack</span>
                        </h3>
                    </div>
                    <Icon path={mdiTrophy} size={4} className="absolute -right-4 -bottom-4 text-white opacity-20" />
                </div>

                {/* Recent Activity */}
                <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Icon path={mdiHistory} size={0.8} />
                    Recent Activity
                </h2>

                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {stats.recentLogs.map((log: any) => (
                                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                            <Icon path={mdiPackageVariantClosed} size={0.8} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">Packing Successfully</p>
                                            <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <span className="font-black text-gray-700">{log.weight.toFixed(2)} kg</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400">
                            No recent activity found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
