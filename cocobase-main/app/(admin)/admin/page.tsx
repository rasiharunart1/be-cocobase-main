import { Suspense, lazy } from "react";
import {
  SkeletonCardTopAdmin,
  SkeletonCardRightAdmin,
} from "@/app/ui/admin/skeleton/dashboard";

export const dynamic = "force-dynamic";

const LazyCardTopAdmin = lazy(() => import("@/app/ui/admin/cardTopAdmin"));
const LazyCardRightAdmin = lazy(() => import("@/app/ui/admin/cardRightAdmin"));
const LazyPetaniPerformance = lazy(() => import("@/app/ui/admin/PetaniPerformance"));
import RealtimeDashboardListener from "@/app/ui/admin/RealtimeDashboardListener";

export default function Page() {
  return (
    <div className="mr-5 md:mr-8 mb-10 transition-all duration-500 ease-in-out">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 uppercase italic">
            Dashboard <span className="text-[#00B69B] not-italic">Admin</span>
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Real-time Production Ecosystem Control</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter italic">Sistem Berjalan Normal</span>
        </div>
      </div>

      {/* Overview Cards (5 Column Grid) */}
      <Suspense fallback={<SkeletonCardTopAdmin />}>
        <LazyCardTopAdmin />
      </Suspense>

      <div className="mt-12 space-y-12">
        {/* Production Performance Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest italic border-l-4 border-[#00B69B] pl-4">Performa Produksi</h2>
            <div className="h-[1px] flex-grow bg-gray-100"></div>
          </div>
          <Suspense fallback={<SkeletonCardRightAdmin />}>
            <LazyCardRightAdmin />
          </Suspense>
        </section>

        {/* Farmer Ecosystem Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest italic border-l-4 border-orange-500 pl-4">Ekosistem Petani</h2>
            <div className="h-[1px] flex-grow bg-gray-100"></div>
          </div>
          <Suspense fallback={<SkeletonCardRightAdmin />}>
            <LazyPetaniPerformance />
          </Suspense>
        </section>
      </div>

      <RealtimeDashboardListener />
    </div>
  );
}