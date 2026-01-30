"use client";

import { useState, useEffect } from "react";
import Icon from "@mdi/react";
import { mdiChartBar, mdiAccountGroup, mdiWeightKilogram, mdiPackageVariantClosed, mdiTrophy } from "@mdi/js";

export default function StatisticsPage() {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/statistics/all`);
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch statistics", error);
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading statistics...</div>;
    }

    const totalWeight = stats.reduce((sum, s) => sum + s.totalWeight, 0);
    const totalPacking = stats.reduce((sum, s) => sum + s.totalPacking, 0);
    const topPerformer = stats.length > 0 ? stats[0] : null;

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Icon path={mdiChartBar} size={1.2} className="text-blue-600" />
                    Farmer Statistics
                </h1>
                <p className="text-gray-500 text-sm mt-1">Performance metrics for all registered farmers</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs uppercase font-bold text-gray-400 mb-1">Total Production</p>
                            <h3 className="text-3xl font-black text-gray-800">{totalWeight.toFixed(1)} <span className="text-lg font-light text-gray-400">kg</span></h3>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-500">
                            <Icon path={mdiWeightKilogram} size={1} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs uppercase font-bold text-gray-400 mb-1">Total Packed</p>
                            <h3 className="text-3xl font-black text-gray-800">{totalPacking} <span className="text-lg font-light text-gray-400">units</span></h3>
                        </div>
                        <div className="bg-purple-50 p-2 rounded-lg text-purple-500">
                            <Icon path={mdiPackageVariantClosed} size={1} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs uppercase font-bold text-gray-400 mb-1">Top Performer</p>
                            <h3 className="text-xl font-bold text-gray-800 truncate w-40">{topPerformer?.nama || "-"}</h3>
                            <p className="text-xs text-green-600 font-bold mt-1">
                                {topPerformer ? `${topPerformer.totalWeight.toFixed(1)} kg produced` : "No data"}
                            </p>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded-lg text-yellow-500">
                            <Icon path={mdiTrophy} size={1} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Icon path={mdiAccountGroup} size={0.8} className="text-gray-500" />
                        Farmer Performance List
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white text-xs uppercase text-gray-400 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Rank</th>
                                <th className="px-6 py-4">Farmer Name</th>
                                <th className="px-6 py-4 text-right">Total Packing</th>
                                <th className="px-6 py-4 text-right">Total Weight</th>
                                <th className="px-6 py-4 text-right">Avg Weight / Pack</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {stats.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No statistics available</td>
                                </tr>
                            ) : (
                                stats.map((stat, index) => (
                                    <tr key={stat.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`
                                                flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs
                                                ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    index === 1 ? 'bg-gray-100 text-gray-700' :
                                                        index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-50 text-gray-500'}
                                            `}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-700">
                                            {stat.nama}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600">
                                            {stat.totalPacking}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-600">
                                            {stat.totalWeight.toFixed(2)} kg
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500">
                                            {(stat.totalWeight / (stat.totalPacking || 1)).toFixed(2)} kg
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
