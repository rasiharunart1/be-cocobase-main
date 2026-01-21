"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Search from "@/app/ui/admin/search";
import { Suspense } from "react";
import Icon from "@mdi/react";
import { mdiAccountCircle } from "@mdi/js";

const TopBar: React.FC = () => {
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
    // Listen for custom event if profile is updated elsewhere (optional but good for UX)
    window.addEventListener("profileUpdated", fetchProfile);
    return () => window.removeEventListener("profileUpdated", fetchProfile);
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAdmin(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch topbar profile", error);
    }
  };

  return (
    <div className="bg-white items-center flex justify-between py-3 mb-5 md:mb-8 pl-4 shadow-sm border-b">
      {/* Div kosong untuk mendorong search bar ke tengah */}
      <div className=""></div>

      {/* Search bar di tengah */}
      <Suspense fallback={<div>Loading...</div>}>
        <Search placeholder="Cari data..." />
      </Suspense>

      {/* Admin Profile Info */}
      <div className="flex flex-row items-center gap-3 mr-10 group cursor-pointer">
        <div className="text-right hidden sm:block">
          <p className="text-[#202224] font-bold text-sm leading-tight">
            {admin?.nama || "Admin Cocobase"}
          </p>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">
            System Administrator
          </p>
        </div>

        <div className="relative h-[44px] w-[44px] rounded-xl overflow-hidden border-2 border-[#00B69B]/20 group-hover:border-[#00B69B] transition-colors">
          {admin?.profile_pic ? (
            <img
              src={admin.profile_pic}
              alt="profile"
              className="object-cover h-full w-full"
            />
          ) : (
            <div className="bg-gray-100 h-full w-full flex items-center justify-center text-gray-400">
              <Icon path={mdiAccountCircle} size={1.2} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
