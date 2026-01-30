"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "@mdi/react";
import {
    mdiWeightKilogram,
    mdiPackageVariantClosed,
    mdiTrophy,
    mdiHistory,
    mdiCogs,
    mdiCheckboxMarkedCircleOutline,
    mdiClockOutline
} from "@mdi/js";
import clsx from "clsx";

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case "DIAYAK": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "DIOVEN": return "bg-orange-100 text-orange-700 border-orange-200";
            case "DISORTIR": return "bg-blue-100 text-blue-700 border-blue-200";
            case "DIKEMAS": return "bg-purple-100 text-purple-700 border-purple-200";
            case "SELESAI": return "bg-green-100 text-green-700 border-green-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00B69B]"></div>
        </div>
    );

    return (
        <div className="mr-5 md:mr-8 mb-5 md:mb-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Beranda Petani</h1>
                <p className="text-gray-500 text-sm italic">Selamat datang kembali, {user?.nama}!</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-[#00B69B]/10 p-4 rounded-2xl text-[#00B69B] group-hover:scale-110 transition-transform">
                            <Icon path={mdiWeightKilogram} size={1.2} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md italic">Total Hasil</span>
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-3xl font-black text-gray-900">
                            {stats?.totalWeight?.toFixed(1) || "0.0"} <span className="text-sm font-medium text-gray-400">kg</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Total berat produksi keseluruhan</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                            <Icon path={mdiPackageVariantClosed} size={1.2} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md italic">Total Packing</span>
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-3xl font-black text-gray-900">
                            {stats?.totalPacking || "0"} <span className="text-sm font-medium text-gray-400">unit</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Jumlah kemasan yang telah diproses</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-orange-50 p-4 rounded-2xl text-orange-500 group-hover:scale-110 transition-transform">
                            <Icon path={mdiTrophy} size={1.2} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md italic">Efektivitas</span>
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-3xl font-black text-gray-900">
                            {stats?.averageWeight?.toFixed(2) || "0.00"} <span className="text-sm font-medium text-gray-400">kg/unit</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Rata-rata berat per kemasan</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Production Activity */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                                <Icon path={mdiCogs} size={0.8} />
                            </div>
                            Tahapan Produksi
                        </h2>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight italic">Status Terbaru</span>
                    </div>

                    <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {stats?.productionActivities && stats.productionActivities.length > 0 ? (
                            stats.productionActivities.map((prod: any) => (
                                <div key={prod.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <p className="font-bold text-gray-800 text-sm">{prod.produk}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Icon path={mdiClockOutline} size={0.5} className="text-gray-400" />
                                                <p className="text-[10px] text-gray-400">{new Date(prod.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={clsx(
                                            "text-[10px] font-bold px-3 py-1 rounded-full border",
                                            getStatusColor(prod.status)
                                        )}>
                                            {prod.status}
                                        </span>
                                        <p className="text-xs font-black text-gray-600">{prod.jumlah} <span className="text-[10px] font-normal text-gray-400 uppercase italic">kg</span></p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-20 text-center text-gray-400 italic text-sm">
                                <Icon path={mdiCogs} size={2} className="mx-auto mb-2 opacity-20" />
                                Belum ada aktivitas produksi.
                            </div>
                        )}
                    </div>
                </div>

                {/* Packing Activity */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#00B69B]/10 flex items-center justify-center text-[#00B69B]">
                                <Icon path={mdiHistory} size={0.8} />
                            </div>
                            Riwayat Packing
                        </h2>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight italic">IoT Real-time</span>
                    </div>

                    <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                            stats.recentLogs.map((log: any) => (
                                <div key={log.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-[#00B69B]/5 flex items-center justify-center text-[#00B69B]">
                                            <Icon path={mdiCheckboxMarkedCircleOutline} size={0.7} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-800 text-sm">Packing Berhasil</p>
                                                <span className="text-[8px] bg-green-50 text-green-600 px-1 rounded font-black italic uppercase">Verified</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{new Date(log.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-black text-gray-800 text-lg">
                                            {log.weight.toFixed(2)}
                                        </span>
                                        <span className="ml-1 text-[10px] font-normal text-gray-400 uppercase italic">kg</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-20 text-center text-gray-400 italic text-sm">
                                <Icon path={mdiHistory} size={2} className="mx-auto mb-2 opacity-20" />
                                Belum ada aktivitas packing.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
