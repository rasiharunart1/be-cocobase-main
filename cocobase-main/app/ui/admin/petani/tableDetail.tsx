"use client";
import Icon from "@mdi/react";
import {
  mdiTriangleSmallDown,
} from "@mdi/js";
import { Produksi } from "@/app/utils/interface";
import { useState, useEffect } from "react";

export default function Table({ produksiList }: { produksiList: Produksi[] }) {
  const [selectedStatus, setSelectedStatus] = useState<{
    value: string;
    label: string;
  }>({ value: "", label: "Status" });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest(".open")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  const statusList = [
    { value: "", label: "Status" },
    { value: "DIAYAK", label: "Diayak" },
    { value: "DIOVEN", label: "Dioven" },
    { value: "DISORTIR", label: "Disortir" },
    { value: "DIKEMAS", label: "Dikemas" },
    { value: "SELESAI", label: "Selesai" },
  ];

  const filteredProduksiList = produksiList.filter((produksi) => {
    if (selectedStatus.value === "") {
      return true;
    } else {
      return produksi.status === selectedStatus.value;
    }
  });

  return (
    <div>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100 grid grid-cols-12">
            <th className="border border-gray-300 p-2 col-span-1">No</th>
            <th className="border border-gray-300 p-2 col-span-5">Produk</th>
            <th className="border border-gray-300 p-2 col-span-2">Jumlah</th>
            <th className="border border-gray-300 p-2 col-span-4">
              <div className="relative">
                <button className="w-full" onClick={() => setIsOpen(!isOpen)}>
                  <div className="flex justify-between">
                    {selectedStatus.label}
                    <Icon path={mdiTriangleSmallDown} size={1} color="#000" />
                  </div>
                </button>
                {isOpen && (
                  <ul
                    className="absolute z-10 mt-1 max-h-56 w-fit overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none transition duration-500 ease-in-out transform"
                    style={{
                      opacity: isOpen ? 1 : 0,
                      transform: isOpen ? "translateY(0)" : "translateY(-100%)",
                    }}
                  >
                    {statusList.map((status) => (
                      <li
                        key={status.value}
                        className="group relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900"
                        onClick={() => {
                          setSelectedStatus(status);
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex items-center">
                          <span className="ml-3 block truncate font-normal">
                            {status.label}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredProduksiList.map((produksi, index) => (
            <tr
              key={produksi.id}
              style={{
                backgroundColor: index % 2 === 1 ? "#f2f2f2" : "#ffffff",
              }}
              className="grid grid-cols-12"
            >
              <td className="border border-gray-300 p-[6px] text-center col-span-1">
                {index + 1}
              </td>
              <td className="border border-gray-300 p-[6px] col-span-5">
                {produksi.produk}{" "}
              </td>
              <td className="border border-gray-300 p-[6px] text-center col-span-2">
                {produksi.jumlah}
              </td>
              <td className="border border-gray-300 p-[6px] text-center col-span-4">
                {produksi.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}