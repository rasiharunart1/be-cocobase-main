import Icon from "@mdi/react";
import {
  mdiFilterVariant,
  mdiCalendarRange,
  mdiPackageVariantClosed,
  mdiCheckboxMarkedOutline,
  mdiSort,
  mdiCog,
  mdiChartLine,
  mdiWeightKilogram,
} from "@mdi/js";
import LineChart from "@/app/ui/admin/chart";
import { getData } from "@/app/utils/fetchData";
import clsx from "clsx";

export default async function CardRightAdmin() {
  const data = await getData({ path: "/dashboard/atas" });

  const keterangan = data?.kanan || [];
  const weightStats = data?.totalWeightStats || { totalWeight: 0, averageWeight: 0 };

  const stages = [
    { name: "Diayak", value: keterangan[0]?.nilai ?? 0, icon: mdiFilterVariant, color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-200" },
    { name: "Dioven", value: keterangan[1]?.nilai ?? 0, icon: mdiCalendarRange, color: "text-orange-600", bg: "bg-orange-100", border: "border-orange-200" },
    { name: "Disortir", value: keterangan[2]?.nilai ?? 0, icon: mdiSort, color: "text-cyan-600", bg: "bg-cyan-100", border: "border-cyan-200" },
    { name: "Kemas Manual", value: keterangan[3]?.nilai ?? 0, icon: mdiPackageVariantClosed, color: "text-rose-600", bg: "bg-rose-100", border: "border-rose-200" },
    { name: "Kemas Mesin (IoT)", value: keterangan[6]?.nilai ?? 0, icon: mdiCog, color: "text-indigo-600", bg: "bg-indigo-100", border: "border-indigo-200" },
    { name: "Selesai", value: keterangan[4]?.nilai ?? 0, icon: mdiCheckboxMarkedOutline, color: "text-emerald-600", bg: "bg-green-100", border: "border-green-200" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
      {/* Visualisasi Produksi (Chart) */}
      <div className="h-full lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00B69B]/10 flex items-center justify-center text-[#00B69B]">
              <Icon path={mdiChartLine} size={1} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Tren Produksi</h3>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest italic">Data Visualisasi 30 Hari Terakhir</p>
            </div>
          </div>
          <div className="flex items-center gap-4 border-l pl-4 border-gray-100">
            <div className="text-right">
              <p className="text-[9px] text-[#00B69B] uppercase font-black italic flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00B69B] animate-pulse"></span>
                Volume Terverifikasi IoT
              </p>
              <div className="flex items-center gap-1 text-gray-800 justify-end">
                <span className="font-black text-2xl">{weightStats.totalWeight.toFixed(1)}</span>
                <span className="text-xs font-medium text-gray-400">kg</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
              <Icon path={mdiWeightKilogram} size={0.8} />
            </div>
          </div>
        </div>
        <div className="flex-grow min-h-[300px]">
          <LineChart />
        </div>
      </div>

      {/* Tahapan Produksi (Stages) */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        {stages.map((stage, index) => (
          <div key={index} className={clsx(
            "bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between group hover:shadow-md transition-all",
            stage.border
          )}>
            <div className="flex items-center gap-3">
              <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", stage.bg, stage.color)}>
                <Icon path={stage.icon} size={1} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{stage.name}</p>
                <h4 className="text-xl font-black text-gray-800">{stage.value}</h4>
              </div>
            </div>
            <div className="text-[10px] font-black text-gray-300 group-hover:text-gray-400 transition-colors uppercase italic orientation-vertical">
              Proses
            </div>
          </div>
        ))}

        {/* Efficiency Card */}
        <div className="mt-2 bg-[#00B69B] p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest italic">Efektivitas</p>
            <h3 className="text-4xl font-black text-white mt-1">{data?.kanan?.[5]?.nilai || 0}%</h3>
            <p className="text-white/50 text-[10px] mt-2 font-medium">Melampaui target bulan lalu</p>
          </div>
          <div className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-125 transition-transform">
            <Icon path={mdiCheckboxMarkedOutline} size={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
