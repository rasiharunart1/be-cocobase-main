"use client";
import Icon from "@mdi/react";
import {
  mdiDeleteOutline,
  mdiArrowUpBoldBoxOutline,
  mdiExpandAll,
} from "@mdi/js";
import { Petani } from "@/app/utils/interface";
import Link from "next/link";
import { getData } from "@/app/utils/fetchData";
import { useState, useEffect } from "react";
import Pagination from "@/app/ui/pagination";
import { formDeleteHandler } from "@/app/utils/actions";

export default function Table({
  currentPage,
  limit,
  search,
}: {
  limit: number;
  currentPage: number;
  search: string;
}) {
  const [petaniList, setPetaniList] = useState<Petani[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [result, setResult] = useState(null);

  const handleDelete = async (id: number, params: string) => {
    const result = await formDeleteHandler({ id, params });
    setResult(result);
    if (result.success) {
      setPetaniList(petaniList.filter((petani) => petani.id !== id));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getData({
          path: "/petani",
          limit: limit,
          currentPage: currentPage,
          search: search,
        });
        if (data.length === 0) {
          setPetaniList([
            {
              id: 0,
              nama: "Tidak Ditemukan",
              alamat: "Tidak Ditemukan",
              no_hp: "Tidak Ditemukan",
              RT: "Tidak Ditemukan",
              RW: "Tidak Ditemukan",
            },
          ]);
        } else {
          setPetaniList(data.petani);
          setTotalItems(Math.ceil(data.pagination.total_items / limit));
        }
      } catch (error) {
        console.error(error);
        setPetaniList([
          {
            id: 0,
            nama: "Tidak Ditemukan",
            alamat: "Tidak Ditemukan",
            no_hp: "Tidak Ditemukan",
            RT: "Tidak Ditemukan",
            RW: "Tidak Ditemukan",
          },
        ]);
      }
    };
    fetchData();
  }, [currentPage, search, limit, result]);

  return (
    <div className="flex flex-col items-center">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">No</th>
            <th className="border border-gray-300 p-2">Nama</th>
            <th className="border border-gray-300 p-2">RT</th>
            <th className="border border-gray-300 p-2">RW</th>
            <th className="border border-gray-300 p-2">Alamat</th>
            <th className="border border-gray-300 p-2">Telepon</th>
            <th className="border border-gray-300 p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {petaniList.map((petani, index) => (
            <tr
              key={petani.id}
              style={{
                backgroundColor: index % 2 === 1 ? "#f2f2f2" : "#ffffff",
              }}
            >
              <td className="border border-gray-300 p-[6px] text-center">
                {index + 1}
              </td>
              <td className="border border-gray-300 p-[6px]">{petani.nama}</td>
              <td className="border border-gray-300 p-[6px] text-center">{petani.RT}</td>
              <td className="border border-gray-300 p-[6px] text-center">{petani.RW}</td>
              <td className="border border-gray-300 p-[6px]">
                {petani.alamat && petani.alamat.length > 30
                  ? petani.alamat.slice(0, 30) + "..."
                  : petani.alamat}
              </td>
              <td className="border border-gray-300 p-[6px]">{petani.no_hp}</td>
              <td className="border border-gray-300 p-[6px]">
                <div className="flex justify-center space-x-2">
                  <Link
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-fit p-1 rounded"
                    href={`/admin/petani/${petani.id}`}
                  >
                    <Icon path={mdiExpandAll} size={1} color="#fff" />
                  </Link>
                  <Link
                    href={`/admin/petani/${petani.id}/edit`}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold w-fit p-1 rounded"
                  >
                    <Icon
                      path={mdiArrowUpBoldBoxOutline}
                      size={1}
                      color="#fff"
                    />
                  </Link>
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold w-fit p-1 rounded"
                    onClick={() => handleDelete(petani.id, "petani")}
                  >
                    <Icon path={mdiDeleteOutline} size={1} color="#fff" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-5"></div>
      <Pagination totalPages={totalItems} />
    </div>
  );
}
