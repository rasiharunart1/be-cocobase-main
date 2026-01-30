"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "@mdi/react";
import { mdiWeightKilogram, mdiPackageVariantClosed, mdiTrophy, mdiHistory } from "@mdi/js";

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

    if (loading) return <div className="p-8 text-[#00B69B] font-medium">Memuat dashboard...</div>;

    return (
        <div className="mr-5 md:mr-8 mb-5 md:mb-8">
            <h1 className="text-3xl font-bold tracking-wide mb-8">Dashboard Petani</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Produksi */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase mb-2">Total Produksi</p>
                        <h3 className="text-2xl font-black text-gray-800">
                            {stats?.totalWeight?.toFixed(1) || "0.0"} <span className="text-sm font-medium text-gray-400">kg</span>
                        </h3>
                    </div>
                    <div className="bg-[#00B69B]/10 p-4 rounded-xl text-[#00B69B]">
                        <Icon path={mdiWeightKilogram} size={1.2} />
                    </div>
                </div>

                {/* Total Kemasan */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase mb-2">Total Kemasan</p>
                        <h3 className="text-2xl font-black text-gray-800">
                            {stats?.totalPacking || "0"} <span className="text-sm font-medium text-gray-400">unit</span>
                        </h3>
                    </div>
                    <div className="bg-[#00B69B]/10 p-4 rounded-xl text-[#00B69B]">
                        <Icon path={mdiPackageVariantClosed} size={1.2} />
                    </div>
                </div>

                {/* Rata-rata Performa */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase mb-2">Rata-rata Berat</p>
                        <h3 className="text-2xl font-black text-gray-800">
                            {stats?.averageWeight?.toFixed(2) || "0.00"} <span className="text-sm font-medium text-gray-400">kg/unit</span>
                        </h3>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl text-orange-500">
                        <Icon path={mdiTrophy} size={1.2} />
                    </div>
                </div>
            </div>

            {/* Recent Activity List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Icon path={mdiHistory} size={1} className="text-[#00B69B]" />
                        Aktivitas Terbaru
                    </h2>
                </div>

                {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {stats.recentLogs.map((log: any) => (
                            <div key={log.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#00B69B]/5 flex items-center justify-center text-[#00B69B]">
                                        <Icon path={mdiPackageVariantClosed} size={0.7} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">Packing Berhasil</p>
                                        <p className="text-[11px] text-gray-400">{new Date(log.createdAt).toLocaleString('id-ID')}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-700 bg-gray-50 px-3 py-1 rounded-full text-xs">
                                    {log.weight.toFixed(2)} kg
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-400 italic text-sm">
                        Belum ada aktivitas packing terbaru.
                    </div>
                )}
            </div>
        </div>
    );
}
