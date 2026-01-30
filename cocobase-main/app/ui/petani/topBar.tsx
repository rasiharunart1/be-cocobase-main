"use client";

import { useState, useEffect } from "react";
import Icon from "@mdi/react";
import { mdiAccountCircle } from "@mdi/js";

const PetaniTopBar: React.FC = () => {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userData = localStorage.getItem("petani_user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    return (
        <div className="bg-white items-center flex justify-between py-3 mb-5 md:mb-8 pl-4 shadow-sm border-b">
            <div className="flex items-center">
                <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest ml-4 hidden md:block">
                    Dashboard Petani
                </h2>
            </div>

            {/* User Profile Info */}
            <div className="flex flex-row items-center gap-3 mr-10 group cursor-pointer">
                <div className="text-right hidden sm:block">
                    <p className="text-[#202224] font-bold text-sm leading-tight">
                        {user?.nama || "Petani"}
                    </p>
                    <p className="text-[#00B69B] text-[10px] font-black uppercase tracking-tighter">
                        Mitra Petani
                    </p>
                </div>

                <div className="relative h-[44px] w-[44px] rounded-xl overflow-hidden border-2 border-[#00B69B]/20 group-hover:border-[#00B69B] transition-colors">
                    <div className="bg-gray-50 h-full w-full flex items-center justify-center text-[#00B69B]">
                        <Icon path={mdiAccountCircle} size={1.2} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PetaniTopBar;
