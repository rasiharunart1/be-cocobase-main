import { Suspense, lazy } from "react";
import {
  SkeletonCardTopAdmin,
  SkeletonCardRightAdmin,
} from "@/app/ui/admin/skeleton/dashboard";

export const dynamic = "force-dynamic";

const LazyCardTopAdmin = lazy(() => import("@/app/ui/admin/cardTopAdmin"));
const LazyCardRightAdmin = lazy(() => import("@/app/ui/admin/cardRightAdmin"));
import RealtimeDashboardListener from "@/app/ui/admin/RealtimeDashboardListener";

export default function Page() {
  return (
    <div className="mr-5 md:mr-8 mb-5 md:mb-8">
      <h1 className="text-3xl font-bold tracking-wide">Dashboard</h1>

      {/* card atas */}
      <Suspense fallback={<SkeletonCardTopAdmin />}>
        <LazyCardTopAdmin />
      </Suspense>

      {/* Card kanan */}
      <Suspense fallback={<SkeletonCardRightAdmin />}>
        <LazyCardRightAdmin />
      </Suspense>

      <RealtimeDashboardListener />
    </div>
  );
}