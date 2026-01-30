import Link from "next/link";
import Image from "next/image";
import Pagination from "@/app/ui/pagination";
import { getData } from "@/app/utils/fetchData";
import { Produk } from "@/app/utils/interface";

export default async function Card({
  currentPage,
  limit,
  search,
  all = false,
}: {
  limit: number;
  currentPage: number;
  search: string;
  all?: boolean;
}) {
  const data = await getData({
    path: "/produk",
    limit: limit,
    currentPage: currentPage,
    search: search,
  });

  const cocoblogList = data?.produk;
  const totalItems = Math.ceil(data.pagination.total_items / limit);

  const nomorTujuan = 6285727055150;

  return (
    <div>
      <div className="grid grid-cols-1 text-left md:grid-cols-2 lg:grid-cols-4 justify-items-center items-center m-auto w-full mt-5 gap-3">
        {cocoblogList?.map((data: Produk, index: number) => {
          return (
            <Link
              key={index}
              href={`/produk/${data.id}`}
              className="flex flex-row justify-start md:flex-col bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 mt-3 h-full w-full overflow-hidden border border-gray-100 group"
            >
              <div className="relative overflow-hidden w-full h-[200px]">
                <Image
                  src={data.gambar}
                  alt={data.nama}
                  width={500}
                  height={500}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex flex-col p-4 grow">
                <h3 className="text-gray-800 text-sm font-medium line-clamp-2 mb-2 group-hover:text-[#E37D2E] transition-colors">
                  {data.nama}
                </h3>
                <p className="text-[#E37D2E] text-lg font-bold">
                  Rp {data.harga?.toLocaleString("id-ID") || 0}
                </p>
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">Terjual {data.jumlah || 0}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {all && (
        <div className="flex justify-center mt-8">
          <Pagination totalPages={totalItems} />
        </div>
      )}
    </div>
  );
}
