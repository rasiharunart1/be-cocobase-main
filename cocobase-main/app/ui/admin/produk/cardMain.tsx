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
            <div
              key={index}
              className="flex flex-row justify-start md:flex-col bg-white rounded-lg shadow-md mt-3 h-full w-full"
            >
              <Image
                src={data.gambar}
                alt={data.nama}
                width={500}
                height={500}
                className="object-cover rounded-lg w-full h-[200px] "
              />
              <div className="flex justify-center my-3 ml-1 md:ml-0 w-[50%] md:w-full">
                <div className="w-[90%]">
                  <h3 className="text-black text-xl font-medium mb-3">
                    {data.nama}
                  </h3>
                  <p className="text-black text-sm line-clamp-3">
                    {data.deskripsi}
                  </p>
                </div>
              </div>

              <div className="w-[90%] mx-auto mb-3 mt-auto flex gap-2">
                <Link
                  target="blank"
                  href={`https://api.whatsapp.com/send?phone=${nomorTujuan}&text=Haloo%20%F0%9F%91%8B%F0%9F%8F%BB%20%20Saya%20tertarik%20untuk%20membeli%20Produk%20ini%0ANama%20%3A%20%5B${data.nama}%5D%0AJumlah%20%3A%20%5B..%5D%0AApakah%20Produk%20tersebut%20tersedia%3F%20Saya%20tunggu%20kabarnya%20ya!%20Terimakasih%20banyak%F0%9F%98%8A`}
                  className=" text-[#E37D2E] grow p-1 rounded"
                >
                  <div className="flex w-fit items-center gap-2">
                    <p className="text-left hover:underline transition duration-300">
                      <span>Pesan sekarang</span>{" "}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
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
