import Icon from "@mdi/react";
import {
  mdiFilterVariant,
  mdiCalendarRange,
  mdiPackageVariantClosed,
  mdiCheckboxMarkedOutline,
  mdiSort,
} from "@mdi/js";
import { mdiTrendingUp } from "@mdi/js";
import Image from "next/image";

export function SkeletonCardTopAdmin() {
  return (
    <>
      {/* card atas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-5 animate-pulse">
        {/* Card Petani */}
        <div className="bg-white p-5 rounded-lg shadow-md">
          <div className="flex justify-between">
            <div>
              <p className="text-base">Petani</p>
              <h2 className="text-2xl tracking-wide font-semibold mt-4 bg-gray-300 h-6 w-1/2 rounded"></h2>
            </div>
            <div className="bg-[#B9C5FF] p-3 flex items-center justify-center aspect-square rounded-3xl w-14 h-14">
              <Image src="/petani.svg" alt="Petani" width={30} height={30} />
            </div>
          </div>
          <p className="text-base mt-2 gap-1 flex items-center">
            <span className="bg-gray-300 h-6 w-1/2 rounded"></span>
            dari bulan lalu
          </p>
        </div>

        {/* Card Produk Terjual */}
        <div className="bg-white p-5 rounded-lg shadow-md">
          <div className="flex justify-between">
            <div>
              <p className="text-base">Produk Terjual</p>
              <h2 className="text-2xl tracking-wide font-semibold mt-4 bg-gray-300 h-6 w-1/2 rounded"></h2>
            </div>
            <div className="bg-[#FFE7A5] p-3 flex items-center justify-center aspect-square rounded-3xl w-14 h-14">
              <Image src="/produk.svg" alt="Petani" width={30} height={30} />
            </div>
          </div>
          <p className="text-base mt-2 flex items-center gap-1">
            <Icon
              path={mdiTrendingUp}
              size={0.9}
              color="#00B69B"
              className="mr-1"
            />
            <span className="bg-gray-300 h-6 w-1/2 rounded"></span>
            dari bulan lalu
          </p>
        </div>

        {/* Card Total Artikel */}
        <div className="bg-white p-5 rounded-lg shadow-md">
          <div className="flex justify-between">
            <div>
              <p className="text-base">Total Artikel</p>
              <h2 className="text-2xl tracking-wide font-semibold mt-4 bg-gray-300 h-6 w-1/2 rounded"></h2>
            </div>
            <div className="bg-[#A0DBBD] p-3 flex items-center justify-center aspect-square rounded-3xl w-14 h-14">
              <Image src="/artikel.svg" alt="Petani" width={25} height={25} />
            </div>
          </div>
          <p className="text-base mt-2 flex items-center gap-1">
            <span className="bg-gray-300 h-6 w-1/2 rounded"></span>
            orang mengunjungi
          </p>
        </div>

        {/* Card Aktivitas Proses */}
        <div className="bg-[#FFDA9D] p-5 rounded-lg shadow-md">
          <div className="flex justify-between">
            <div>
              <p className="text-base">Aktivitas Proses</p>
              <h2 className="text-2xl tracking-wide font-semibold mt-4 bg-gray-300 h-6 w-1/2 rounded"></h2>
            </div>
            <div className="bg-[#FEE8CC] p-3 flex items-center justify-center aspect-square rounded-3xl w-14 h-14">
              <Image src="/proses.svg" alt="Petani" width={30} height={30} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function SkeletonCardRightAdmin() {
  return (
    <div className="grid grid-cols-4 gap-5 mt-5">
      {/* Kiri */}
      <div className="h-full col-span-3 bg-white p-5 rounded-lg shadow-md animate-pulse">
        <div className="h-6 w-full bg-gray-300 rounded"></div>
      </div>

      {/* Kanan */}
      <div className="col-span-1">
        {/* Diayak */}
        <div className="bg-white p-5 rounded-lg shadow-md flex justify-between animate-pulse">
          <div>
            <p className="text-base">Diayak</p>
            <h2 className="text-2xl tracking-wide font-semibold mt-4 bg-gray-300 h-6 w-1/2 rounded"></h2>
          </div>
          <div className="bg-[#FEE8CC] p-3 flex items-center justify-center aspect-square rounded-3xl w-14 h-14">
            <Icon path={mdiFilterVariant} size={2} color="#bbac24f1" />
          </div>
        </div>

        {/* Dioven */}
        <div className="bg-white p-5 rounded-lg shadow-md flex justify-between mt-5 animate-pulse">
          <div>
            <p className="text-base">Dioven</p>
            <h2 className="text-2xl tracking-wide font-semibold mt-4 bg-gray-300 h-6 w-1/2 rounded"></h2>
          </div>
          <div className="bg-[#fcddb5] p-3 flex items-center justify-center aspect-square rounded-3xl w-14 h-14">
            <Icon path={mdiCalendarRange} size={2} color="#83450F" />
          </div>
        </div>
        
        {/* Disortir */}
        <div className="bg-white p-5 rounded-lg shadow-md flex justify-between mt-5 animate-pulse">
          <div>
            <p className="text-base">Dioven</p>
            <h2 className="text-2xl tracking-wide font-semibold mt-4 bg-gray-300 h-6 w-1/2 rounded"></h2>
          </div>
          <div className="bg-[#9bdada] p-3 flex items-center justify-center aspect-square rounded-3xl w-14 h-14">
            <Icon path={mdiSort} size={2} color="#0d7979" />
          </div>
        </div>

        {/* Dikemas */}
        <div className="bg-white p-5 rounded-lg shadow-md flex justify-between mt-5 animate-pulse">
          <div>
            <p className="text-base">Dikemas</p>
            <h2 className="text-2xl tracking-wide font-semibold mt-4 bg-gray-300 h-6 w-1/2 rounded"></h2>
          </div>
          <div className="bg-[#fa9d9d] p-3 flex items-center justify-center aspect-square rounded-3xl w-14 h-14">
            <Icon path={mdiPackageVariantClosed} size={2} color="#C63535" />
          </div>
        </div>

        {/* Selesai */}
        <div className="bg-white p-5 rounded-lg shadow-md flex justify-between mt-5 animate-pulse">
          <div>
            <p className="text-base">Selesai</p>
            <h2 className="text-2xl tracking-wide font-semibold mt-4 bg-gray-300 h-6 w-1/2 rounded"></h2>
          </div>
          <div className="bg-[#93ffb4] p-3 flex items-center justify-center aspect-square rounded-3xl w-14 h-14">
            <Icon path={mdiCheckboxMarkedOutline} size={2} color="#34A190" />
          </div>
        </div>
      </div>
    </div>
  );
}