import Icon from "@mdi/react";
import {
    mdiTrophy,
    mdiAccountGroup,
    mdiWeightKilogram,
    mdiPackageVariantClosed,
    mdiSort,
    mdiAccessPoint,
    mdiClockOutline,
    mdiAlertCircle
} from "@mdi/js";
import { getData } from "@/app/utils/fetchData";
import Link from "next/link";
import clsx from "clsx";

export default async function PetaniPerformance() {
    const data = await getData({ path: "/dashboard/atas" });
    const performance = data?.petaniPerformance || [];
    const topFarmers = data?.topFarmers || [];
    const recentActivities = data?.recentActivities || [];

    return (
        <div className="flex flex-col gap-8 mt-12">
            {/* Recent IoT Activity Feed */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-2">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest italic flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                        Live IoT Activities
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        Last 5 Transmissions
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {recentActivities.map((act: any, i: number) => (
                        <div key={i} className="flex flex-col p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[8px] font-black text-gray-400 uppercase">{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Icon path={mdiAccessPoint} size={0.4} />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-gray-800 truncate">{act.petani?.nama || "Unknown Farmer"}</p>
                            <p className="text-[9px] text-[#00B69B] font-bold mt-1">{act.weight.toFixed(2)} kg</p>
                            {!act.petani && (
                                <div className="mt-1 flex items-center gap-1 text-[8px] text-amber-600 font-black uppercase italic">
                                    <Icon path={mdiAlertCircle} size={0.3} />
                                    No Session
                                </div>
                            )}
                        </div>
                    ))}
                    {recentActivities.length === 0 && (
                        <div className="col-span-5 text-center py-4 text-gray-400 italic text-xs">Waiting for device signals...</div>
                    )}
                </div>
            </div>

            {/* Row 1: Top 3 IoT Leaderboard (Medals) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topFarmers.slice(0, 3).map((farmer: any, index: number) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${index === 0 ? "bg-yellow-400 text-white shadow-lg shadow-yellow-200" :
                                    index === 1 ? "bg-gray-300 text-white shadow-lg shadow-gray-100" :
                                        "bg-orange-300 text-white shadow-lg shadow-orange-100"
                                }`}>
                                {farmer.rank}
                            </div>
                            <div>
                                <h4 className="font-black text-gray-800 uppercase tracking-tight">{farmer.nama}</h4>
                                <p className="text-[10px] text-[#00B69B] font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Icon path={mdiWeightKilogram} size={0.4} />
                                    {farmer.totalWeight.toFixed(1)} kg IoT
                                </p>
                            </div>
                        </div>
                        <Icon path={mdiTrophy} size={3} className={clsx(
                            "absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform",
                            index === 0 ? "text-yellow-600" : index === 1 ? "text-gray-500" : "text-orange-600"
                        )} />
                    </div>
                ))}
            </div>

            {/* Row 2: Performance Matrix Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-gray-800 uppercase italic flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#00B69B]/10 flex items-center justify-center text-[#00B69B]">
                                <Icon path={mdiAccountGroup} size={0.6} />
                            </div>
                            Matriks Performa Petani (Real-time)
                        </h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 ml-10 italic">Integrasi Data IoT & Jalur Produksi</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-tighter">
                        Live Tracking
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Petani</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Output IoT (kg)</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Pack IoT</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pipeline Produksi (Aktif)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {performance.length > 0 ? (
                                performance.map((p: any, index: number) => (
                                    <tr key={index} className={clsx("hover:bg-gray-50 transition-colors", p.id === 0 && "bg-amber-50/30")}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {p.id === 0 && <Icon path={mdiAlertCircle} size={0.6} className="text-amber-500" />}
                                                <div>
                                                    <p className={clsx("font-bold text-sm", p.id === 0 ? "text-amber-700 italic" : "text-gray-800")}>{p.nama}</p>
                                                    <p className="text-[9px] text-gray-400 uppercase font-medium">{p.id === 0 ? "Data Tanpa Sesi Aktif" : `Mitra Id: #${p.id}`}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={clsx("text-sm font-black", p.id === 0 ? "text-amber-600" : "text-[#00B69B]")}>{p.iotWeight.toFixed(1)}</span>
                                                <div className="flex items-center gap-0.5 mt-0.5">
                                                    <span className={clsx("w-1 h-1 rounded-full animate-pulse", p.id === 0 ? "bg-amber-400" : "bg-blue-400")}></span>
                                                    <span className={clsx("text-[8px] font-bold uppercase italic", p.id === 0 ? "text-amber-400" : "text-blue-400")}>
                                                        {p.id === 0 ? "Needs Assign" : "IoT Verified"}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={clsx("text-sm font-bold", p.id === 0 ? "text-amber-600" : "text-blue-600")}>{p.iotPackCount}</span>
                                            <p className="text-[8px] text-gray-400 uppercase italic">Packs</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <StageBadge name="Diayak" count={p.stages.diayak} color="amber" />
                                                <Icon path={mdiSort} size={0.3} className="text-gray-300 transform rotate-180" />
                                                <StageBadge name="Dioven" count={p.stages.dioven} color="orange" />
                                                <Icon path={mdiSort} size={0.3} className="text-gray-300 transform rotate-180" />
                                                <StageBadge name="Disortir" count={p.stages.disortir} color="cyan" />
                                                <Icon path={mdiSort} size={0.3} className="text-gray-300 transform rotate-180" />
                                                <StageBadge name="Dikemas" count={p.stages.dikemas} color="rose" />
                                                <Icon path={mdiSort} size={0.3} className="text-gray-300 transform rotate-180" />
                                                <StageBadge name="Selesai" count={p.stages.selesai} color="emerald" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center text-gray-400 italic text-sm">
                                        Belum ada data performa petani tersedia.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-center">
                    <Link href="/admin/petani" className="text-[10px] font-black text-[#00B69B] uppercase tracking-widest hover:underline flex items-center gap-2">
                        Kelola Seluruh Hubungan Petani
                        <Icon path={mdiAccountGroup} size={0.5} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

function StageBadge({ name, count, color }: { name: string, count: number, color: string }) {
    if (count === 0) return (
        <div className="w-8 h-8 rounded-lg border border-dashed border-gray-200 flex items-center justify-center opacity-30 grayscale" title={name}>
            <span className="text-[9px] font-bold text-gray-400">0</span>
        </div>
    );

    const colors: any = {
        amber: "bg-amber-100 text-amber-700 border-amber-200",
        orange: "bg-orange-100 text-orange-700 border-orange-200",
        cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
        rose: "bg-rose-100 text-rose-700 border-rose-200",
        emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };

    return (
        <div className={clsx(
            "w-8 h-8 rounded-lg border flex flex-col items-center justify-center shadow-sm transition-transform hover:scale-110 cursor-help",
            colors[color]
        )} title={`${name}: ${count} item`}>
            <span className="text-[9px] font-black">{count}</span>
            <span className="text-[6px] font-bold uppercase tracking-tighter opacity-70 leading-none">{name.slice(0, 3)}</span>
        </div>
    );
}
