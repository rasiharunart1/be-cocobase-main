import Table from "@/app/ui/admin/petani/tableDetail";
import Link from "next/link";
import { getData } from "@/app/utils/fetchData";

export default async function Page(props: {
  searchParams?: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
  params: Promise<{ id: string }>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams?.search || "";
  const currentPage = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 20;

  const params = await props.params;
  const id = params.id;

  const petaniList = await getData({
    path: `/petani/${id}`,
    limit: limit,
    currentPage: currentPage,
    search: search,
  });

  return (
    <div className="mr-5 p-10 md:mr-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-4">{petaniList?.nama ?? "Data tidak ditemukan"} </h1>

      <div className="flex justify-between items-end mb-4">
        <div className="flex gap-3">
          <div>
            <p>RT</p>
            <p>RW</p>
            <p>alamat</p>
            <p>telepon</p>
          </div>
          <div>
            <p>: {petaniList?.RT ?? "Data tidak ditemukan"}</p>
            <p>: {petaniList?.RW ?? "Data tidak ditemukan"}</p>
            <p>: {petaniList?.alamat ?? "Data tidak ditemukan" }</p>
            <p>: {petaniList?.no_hp ?? "Data tidak ditemukan"}</p>
          </div>
        </div>
      </div>

        <Table produksiList={petaniList.produksi} />

        <Link
          href={`/admin/petani`}
          className="w-fit mt-4 flex py-3 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg--500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          <p>Kembali</p>
        </Link>
    </div>
  );
}
