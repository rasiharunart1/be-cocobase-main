import Table from "@/app/ui/admin/pesanan/tabel";
import { Metadata } from "next";
import Form from "@/app/ui/admin/pesanan/form";


export const metadata: Metadata = {
  title: "Pesanan",
};

export default async function Page(props: {
  searchParams?: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams?.search || "";
  const currentPage = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 20;

  return (
    <div className="mr-5 p-10 md:mr-8 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold mb-4">Pesanan</h1>
        <Form />
      </div>
      <Table limit={limit} currentPage={currentPage} search={search} />
    </div>
  );
}
