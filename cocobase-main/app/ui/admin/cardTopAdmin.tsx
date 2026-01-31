import Icon from "@mdi/react";
import { mdiTrendingUp } from "@mdi/js";
import Petani from "../../../public/petani.svg";
import Produk from "../../../public/produk.svg";
import Artikel from "../../../public/artikel.svg";
import Aktivitas from "../../../public/proses.svg";
import Image from "next/image";
import clsx from "clsx";
import Link from "next/link";
import { getData } from "@/app/utils/fetchData";


export default async function CardTopAdmin() {
  const data = await getData({ path: "/dashboard/atas" });

  const keterangan = data?.atas || [];
  const weightStats = data?.totalWeightStats || { totalWeight: 0, averageWeight: 0 };

  return (
    <>
      {/* card atas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mt-5">
        {/* Card Petani */}
        <Link
          href={"/admin/petani"}
          className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Petani</p>
              <h2 className="text-2xl tracking-wide font-bold mt-2">
                {keterangan[0]?.value ?? 0}
              </h2>
            </div>
            <div className="bg-[#B9C5FF]/20 p-3 flex items-center justify-center aspect-square rounded-2xl w-12 h-12">
              <Image src={Petani} alt="Petani" width={24} height={24} />
            </div>
          </div>
          <p className="text-xs mt-3 gap-1 flex items-center text-gray-400">
            <span
              className={clsx("font-bold", {
                "text-red-500":
                  keterangan[0]?.nilai !== undefined && keterangan[0].nilai < 0,
                "text-[#00B69B]":
                  keterangan[0]?.nilai !== undefined &&
                  keterangan[0].nilai >= 0,
              })}
            >
              {keterangan[0]?.nilai >= 0 ? "+" : ""}{keterangan[0]?.nilai ?? 0}
            </span>
            petani baru bulan ini
          </p>
        </Link>

        {/* Card Total Produksi (New) */}
        <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Produksi</p>
              <h2 className="text-2xl tracking-wide font-bold mt-2">
                {weightStats.totalWeight.toFixed(1)} <span className="text-sm font-normal text-gray-400">kg</span>
              </h2>
            </div>
            <div className="bg-[#00B69B]/10 p-3 flex items-center justify-center aspect-square rounded-2xl w-12 h-12 text-[#00B69B]">
              <Icon path={mdiTrendingUp} size={1} />
            </div>
          </div>
          <p className="text-xs mt-3 text-gray-400 italic">
            Rata-rata {weightStats.averageWeight.toFixed(2)} kg/packing
          </p>
        </div>

        {/* Card Produk Terjual */}
        <Link
          href={"/admin/produk"}
          className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Produk Terjual</p>
              <h2 className="text-2xl tracking-wide font-bold mt-2">
                {keterangan[1]?.value ?? 0}
              </h2>
            </div>
            <div className="bg-[#FFE7A5]/30 p-3 flex items-center justify-center aspect-square rounded-2xl w-12 h-12">
              <Image src={Produk} alt="Produk" width={24} height={24} />
            </div>
          </div>
          <p className="text-xs mt-3 flex items-center gap-1 text-gray-400">
            <span
              className={clsx("font-bold", {
                "text-red-500":
                  keterangan[1]?.nilai !== undefined && keterangan[1].nilai < 0,
                "text-[#00B69B]":
                  keterangan[1]?.nilai !== undefined &&
                  keterangan[1].nilai >= 0,
              })}
            >
              {keterangan[1]?.nilai >= 0 ? "+" : ""}{keterangan[1]?.nilai ?? 0}
            </span>
            dari bulan lalu
          </p>
        </Link>

        {/* Card Total Artikel */}
        <Link
          href={"/admin/cocoblog"}
          className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Artikel</p>
              <h2 className="text-2xl tracking-wide font-bold mt-2">
                {keterangan[2]?.value ?? 0}
              </h2>
            </div>
            <div className="bg-[#A0DBBD]/30 p-3 flex items-center justify-center aspect-square rounded-2xl w-12 h-12">
              <Image src={Artikel} alt="Artikel" width={20} height={20} />
            </div>
          </div>
          <p className="text-xs mt-3 flex items-center gap-1 text-gray-400">
            <span className="text-[#00B69B] font-bold">
              {keterangan[2]?.nilai ?? 0}
            </span>
            artikel baru bulan ini
          </p>
        </Link>

        {/* Card Aktivitas Proses */}
        <div className="bg-[#FFDA9D] p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-[#83450F] text-sm font-bold uppercase tracking-tighter">Efisiensi</p>
              <h2 className="text-3xl tracking-wide font-black mt-2 text-[#83450F]">
                {data.kanan[5]?.nilai ?? 0}%
              </h2>
            </div>
            <div className="bg-[#FEE8CC] p-3 flex items-center justify-center aspect-square rounded-2xl w-12 h-12">
              <Image src={Aktivitas} alt="Aktivitas" width={24} height={24} />
            </div>
          </div>
          <p className="text-xs mt-3 text-[#83450F]/70 italic font-medium">Target selesai bulan ini</p>
        </div>
      </div>
    </>
  );
}
