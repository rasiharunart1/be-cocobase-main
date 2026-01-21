"use client";
import Icon from "@mdi/react";
import { mdiDeleteOutline, mdiExpandAll, mdiRefresh } from "@mdi/js";
import { Pembeli, ProdukSelect, Transaksi } from "@/app/utils/interface";
import { getData } from "@/app/utils/fetchData";
import { useState, useEffect } from "react";
import Pagination from "@/app/ui/pagination";
import { formDeleteHandler } from "@/app/utils/actions";
import { getDataNoQuery } from "@/app/utils/fetchData";
import FormTransaksi from "@/app/ui/admin/pesanan/transaksi";
import { toast } from "react-toastify";
import FormUpdate from "@/app/ui/admin/pesanan/formUpdate";

export default function Table({
  currentPage,
  limit,
  search,
}: {
  limit: number;
  currentPage: number;
  search: string;
}) {
  const [pembeliList, setPembeliList] = useState<Pembeli[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState(null);
  const [produk, setProduk] = useState<ProdukSelect[]>([]);
  const [selectedPembeli, setSelectedPembeli] = useState<Pembeli | null>(null);
  const [refresh, setRefresh] = useState(false);

  const handleDelete = async (id: number, params: string) => {
    const result = await formDeleteHandler({ id, params });
    setResult(result);
    if (result.success) {
      setPembeliList(pembeliList.filter((pembeli) => pembeli.id !== id));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [produkData, pembeliData] = await Promise.all([
          getDataNoQuery({ path: "/produk" }),
          getData({
            path: "/pembeli",
            limit: limit,
            currentPage: currentPage,
            search: search,
          }),
        ]);

        if (produkData.length === 0) {
          setProduk([
            {
              id: 0,
              nama: "Produk Tidak Tersedia",
            },
          ]);
        } else {
          setProduk(produkData.produk);
        }

        setPembeliList(pembeliData.pembeli);
        setTotalItems(Math.ceil(pembeliData.pagination.total_items / limit));
      } catch (error) {
        console.error(error);
        setProduk([
          {
            id: 0,
            nama: "Tidak Ditemukan",
          },
        ]);
      }
    };
    fetchData();
  }, [currentPage, search, limit, result, refresh]);

  const handleShowModal = (produksi: Pembeli) => {
    setShowModal(true);
    setSelectedPembeli(produksi);
  };

  const handleRefresh = () => {
    toast.info("Refresh Data");
    setRefresh(!refresh);
  };

  return (
    <div>
      <button
        onClick={() => handleRefresh()}
        className="flex h-10 items-center rounded-lg bg-gray-600 px-4 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700"
      >
        <p className="flex items-center">
          <Icon path={mdiRefresh} size={1} color="#fff" />
          <span className="font-bold text-xl mr-1"></span> Refresh
        </p>
      </button>
      <div className="flex flex-col items-center mt-4">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 grid grid-cols-12">
              <th className="border border-gray-300 p-2 col-span-1">No</th>
              <th className="border border-gray-300 p-2 col-span-3">Nama</th>
              <th className="border border-gray-300 p-2 col-span-3">Alamat</th>
              <th className="border border-gray-300 p-2 col-span-2">Telepon</th>
              <th className="border border-gray-300 p-2 col-span-1">Trx</th>
              <th className="border border-gray-300 p-2 col-span-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {pembeliList.map((pembeli, index) => (
              <tr
                key={pembeli.id}
                style={{
                  backgroundColor: index % 2 === 1 ? "#f2f2f2" : "#ffffff",
                }}
                className="bg-gray-100 grid grid-cols-12"
              >
                <td className="border border-gray-300 p-[6px] text-center col-span-1">
                  {index + 1}
                </td>
                <td className="border border-gray-300 p-[6px] col-span-3">
                  {pembeli.nama}
                </td>
                <td className="border border-gray-300 p-[6px] col-span-3">
                  {pembeli.alamat && pembeli.alamat.length > 50
                    ? pembeli.alamat.slice(0, 50) + "..."
                    : pembeli.alamat}
                </td>
                <td className="border border-gray-300 p-[6px] col-span-2">
                  {pembeli.no_telp}
                </td>
                <td className="border border-gray-300 p-[6px] col-span-1 text-center">
                  {pembeli.transaksi.length}
                </td>
                <td className="border border-gray-300 p-[6px] col-span-2">
                  <div className="flex justify-center space-x-2">
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-fit p-1 rounded"
                      onClick={() => {
                        handleShowModal(pembeli);
                      }}
                    >
                      <Icon path={mdiExpandAll} size={1} color="#fff" />
                    </button>
                    <FormUpdate pembeli={pembeli} />
                    <button
                      className="bg-red-500 hover:bg-red-700 text-white font-bold w-fit p-1 rounded"
                      onClick={() => handleDelete(pembeli.id, "pembeli")}
                    >
                      <Icon path={mdiDeleteOutline} size={1} color="#fff" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {showModal && (
          <div
            className="fixed top-0 left-0 w-full h-full bg-gray-500 bg-opacity-75 flex justify-center items-center z-50"
            onClick={() => setShowModal(false)}
          >
            {/* jika pengen scroll tabel doang bisa diganti yang max-h-screen jadi h-screen */}
            <div
              className="bg-white p-4 rounded-lg w-2/3 max-h-screen overflow-y-auto z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-2">Transaksi</h2>
              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-1">
                  <p>Pembeli</p>
                  <p>No HP</p>
                  <p>alamat</p>
                </div>
                <div className="col-span-3">
                  <p>: {selectedPembeli?.nama}</p>
                  <p>: {selectedPembeli?.no_telp}</p>
                  <p>: {selectedPembeli?.alamat}</p>
                </div>
                <div className="flex gap-3 justify-end col-span-2">
                  {selectedPembeli && produk && (
                    <FormTransaksi
                      idPembeli={selectedPembeli.id}
                      namaPembeli={selectedPembeli.nama}
                      produk={produk}
                    />
                  )}

                  {!selectedPembeli ||
                    (!produk && <p>Refres untuk update data</p>)}

                  <button
                    className="flex h-10 rounded-lg bg-gray-600 mr-1 items-center p-3 text-gray-200 font-semibold transition-colors hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
                    onClick={() => setShowModal(!showModal)}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center mt-4 w-full max-h-[80%]">
                <div className="overflow-y-auto max-h-full">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100 grid grid-cols-12">
                        <th className="border border-gray-300 p-2 col-span-1">
                          No
                        </th>
                        <th className="border border-gray-300 p-2 col-span-3">
                          Produk
                        </th>
                        <th className="border border-gray-300 p-2 col-span-1">
                          Jumlah
                        </th>
                        <th className="border border-gray-300 p-2 col-span-2">
                          Harga
                        </th>
                        <th className="border border-gray-300 p-2 col-span-3">
                          Total
                        </th>
                        <th className="border border-gray-300 p-2 col-span-2">
                          Tanggal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPembeli?.transaksi.map(
                        (transaksi: Transaksi, index: number) => (
                          <tr
                            key={transaksi.id}
                            style={{
                              backgroundColor:
                                index % 2 === 1 ? "#f2f2f2" : "#ffffff",
                            }}
                            className="bg-gray-100 grid grid-cols-12"
                          >
                            <td className="border border-gray-300 p-[6px] text-center col-span-1">
                              {index + 1}
                            </td>
                            <td className="border border-gray-300 p-[6px] col-span-3">
                              {transaksi.produk}
                            </td>
                            <td className="border border-gray-300 p-[6px] text-center col-span-1">
                              {transaksi.jumlah}
                            </td>
                            <td className="border border-gray-300 p-[6px] col-span-2">
                              Rp {transaksi.harga}
                            </td>
                            <td className="border border-gray-300 p-[6px] col-span-3">
                              Rp {transaksi.total}
                            </td>
                            <td className="border border-gray-300 p-[6px] col-span-2">
                              {transaksi.createdAt}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="mt-5">
          <Pagination totalPages={totalItems} />
        </div>
      </div>
    </div>
  );
}
