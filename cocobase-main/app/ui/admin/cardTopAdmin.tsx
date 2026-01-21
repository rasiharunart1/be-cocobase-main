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

  const keterangan = data?.atas;

  return (
    <>
      {/* card atas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-5">
        {/* Card Petani */}
        <Link
          href={"/admin/petani"}
          className="bg-white p-5 rounded-lg shadow-md"
        >
          <div className="flex justify-between">
            <div>
              <p className="text-base">Petani</p>
              <h2 className="text-2xl tracking-wide font-semibold mt-4">
                {keterangan[0]?.value ?? 0} Orang
              </h2>
            </div>
            <div className="bg-[#B9C5FF] p-3 flex items-center justify-center aspect-square rounded-3xl w-14 h-14">
              <Image src={Petani} alt="Petani" width={30} height={30} />
            </div>
          </div>
          <p className="text-base mt-2 gap-1 flex items-center">
            <span
              className={clsx({
                "text-red-500":
                  keterangan[0]?.nilai !== undefined && keterangan[0].nilai < 0,
                "text-[#00B69B]":
                  keterangan[0]?.nilai !== undefined &&
                  keterangan[0].nilai >= 0,
              })}
            >
              +{keterangan[0]?.nilai ?? 0}
            </span>
            dari bulan lalu
          </p>
        </Link>

        {/* Card Produk Terjual */}
        <Link
          href={"/admin/produk"}
          className="bg-white p-5 rounded-lg shadow-md"
        >
          <div className="flex justify-between">
            <div>
              <p className="text-base">Produk Terjual</p>
              <h2 className="text-2xl tracking-wide font-semibold mt-4">
                {keterangan[1]?.value ?? 0}
              </h2>
            </div>
            <div className="bg-[#FFE7A5] p-3 flex items-center justify-center aspect-square rounded-3xl w-14 h-14">
              <Image src={Produk} alt="Petani" width={30} height={30} />
            </div>
          </div>
          <p className="text-base mt-2 flex items-center gap-1">
            <Icon
              path={mdiTrendingUp}
              size={0.9}
              color="#00B69B"
              className="mr-1"
            />
            <span
              className={clsx({
                "text-red-500":
                  keterangan[1]?.nilai !== undefined && keterangan[1].nilai < 0,
                "text-[#00B69B]":
                  keterangan[1]?.nilai !== undefined &&
                  keterangan[1].nilai >= 0,
              })}
            >
              {keterangan[1]?.nilai ?? 0}
            </span>
            dari bulan lalu
          </p>
        </Link>

        {/* Card Total Artikel */}
        <Link
          href={"/admin/cocoblog"}
          className="bg-white p-5 rounded-lg shadow-md"
        >
          <div className="flex justify-between">
            <div>
              <p className="text-base">Total Artikel</p>
              <h2 className="text-2xl tracking-wide font-semibold mt-4">
                {keterangan[2]?.value ?? 0}
              </h2>
            </div>
            <div className="bg-[#A0DBBD] p-3 flex items-center justify-center aspect-square rounded-3xl w-14 h-14">
              <Image src={Artikel} alt="Petani" width={25} height={25} />
            </div>
          </div>
          <p className="text-base mt-2 flex items-center gap-1">
            <span
              className={clsx({
                "text-red-500":
                  keterangan[2]?.nilai !== undefined && keterangan[2].nilai < 0,
                "text-[#00B69B]":
                  keterangan[2]?.nilai !== undefined &&
                  keterangan[2].nilai >= 0,
              })}
            >
              {keterangan[2]?.nilai ?? 0}
            </span>
            artikel baru bulan ini
          </p>
        </Link>

        {/* Card Aktivitas Proses */}
        <div className="bg-[#FFDA9D] p-5 rounded-lg shadow-md">
          <div className="flex justify-between">
            <div>
              <p className="text-base">Aktivitas Proses</p>
              <h2 className="text-2xl tracking-wide font-semibold mt-4">
                {data.kanan[5]?.nilai ?? 0}%
              </h2>
            </div>
            <div className="bg-[#FEE8CC] p-3 flex items-center justify-center aspect-square rounded-3xl w-14 h-14">
              <Image src={Aktivitas} alt="Petani" width={30} height={30} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
