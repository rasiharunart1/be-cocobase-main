"use client";
import Icon from "@mdi/react";
import {
  mdiDeleteOutline,
  mdiArrowUpBoldBoxOutline,
  mdiTriangleSmallDown,
} from "@mdi/js";
import { Produksi } from "@/app/utils/interface";
import { getData } from "@/app/utils/fetchData";
import { useState, useEffect } from "react";
import Pagination from "@/app/ui/pagination";
import Link from "next/link";
import clsx from "clsx";
import { useFormStatus } from "react-dom";
import {
  formSubmitHandlerPetani,
  formDeleteHandler,
} from "@/app/utils/actions";

export default function Table({
  currentPage,
  limit,
  search,
}: {
  limit: number;
  currentPage: number;
  search: string;
}) {
  const [produksiList, setProduksiList] = useState<Produksi[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<{
    value: string;
    label: string;
  }>({ value: "", label: "Status" });
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduksi, setSelectedProduksi] = useState<Produksi | null>(
    null
  );
  const [result, setResult] = useState<{
    success: boolean;
    data?: any;
    message?: any;
  } | null>(null);
  const { pending } = useFormStatus();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getData({
          path: "/produksi",
          limit: limit,
          currentPage: currentPage,
          search: search,
          status: selectedStatus.value,
        });
        if (data.length === 0) {
          setProduksiList([
            {
              id: 0,
              petani: "Tidak Ditemukan",
              produk: "Tidak Ditemukan",
              jumlah: 0,
              status: "Tidak Ditemukan",
            },
          ]);
        } else {
          setProduksiList(data.produksi);
          setTotalItems(Math.ceil(data.pagination.total_items / limit));
        }
      } catch (error) {
        console.error(error);
        setProduksiList([
          {
            id: 0,
            petani: "Tidak Ditemukan",
            produk: "Tidak Ditemukan",
            jumlah: 0,
            status: "Tidak Ditemukan",
          },
        ]);
      }
    };
    fetchData();

    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest(".open")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [currentPage, search, limit, selectedStatus, isOpen, result]);

  const handleDelete = async (id: number, params: string) => {
    const result = await formDeleteHandler({ id, params });
    setResult(result);
    if (result.success) {
      setProduksiList(produksiList.filter((produksi) => produksi.id !== id));
    }
  };

  const handleUpdate = async (id: number, params: string, status: string) => {
    const formData = new FormData();
    formData.append("id_update", id.toString());
    formData.append("params", params);
    formData.append("status", status);
    const result = await formSubmitHandlerPetani(undefined, formData);
    setResult(result);
    if (result.success) {
      setShowModal(!showModal);
      setProduksiList(
        produksiList.map((produksi) => {
          if (produksi.id === id) {
            return { ...produksi, status: status };
          }
          return produksi;
        })
      );
    }
  };

  const handleShowModal = (produksi: Produksi) => {
    setShowModal(true);
    setSelectedProduksi(produksi);
  };

  const statusListOption = [
    { value: "DIAYAK", label: "Diayak" },
    { value: "DIOVEN", label: "Dioven" },
    { value: "DISORTIR", label: "Disortir" },
    { value: "DIKEMAS", label: "Dikemas" },
    { value: "SELESAI", label: "Selesai" },
  ];

  const statusList = [{ value: "", label: "Status" }, ...statusListOption];

  return (
    <div>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100 grid grid-cols-12">
            <th className="border border-gray-300 p-2 col-span-1">No</th>
            <th className="border border-gray-300 p-2 col-span-3">Petani</th>
            <th className="border border-gray-300 p-2 col-span-2">Produk</th>
            <th className="border border-gray-300 p-2 col-span-2">Jumlah</th>
            <th className="border border-gray-300 p-2 col-span-2">
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
            <th className="border border-gray-300 p-2 col-span-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {produksiList.map((produksi, index) => (
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
              <td className="border border-gray-300 p-[6px] col-span-3">
                {produksi.petani}
              </td>
              <td className="border border-gray-300 p-[6px] col-span-2">
                {produksi.produk}{" "}
              </td>
              <td className="border border-gray-300 p-[6px] text-center col-span-2">
                {produksi.jumlah}
              </td>
              <td className="border border-gray-300 p-[6px] text-center col-span-2">
                <button
                  className={clsx(
                    "py-1 px-2 rounded",
                    produksi.status === "DIAYAK" && "bg-yellow-300",
                    produksi.status === "DIOVEN" && "bg-orange-300",
                    produksi.status === "DISORTIR" && "bg-blue-300",
                    produksi.status === "DIKEMAS" && "bg-purple-300",
                    produksi.status === "SELESAI" && "bg-green-300"
                  )}
                  onClick={() => {
                    handleShowModal(produksi);
                  }}
                >
                  {produksi.status}
                </button>
              </td>
              <td className="border border-gray-300 p-[6px] col-span-2">
                <div className="flex justify-center space-x-2">
                  <Link
                    className="bg-green-500 hover:bg-green-700 text-white font-bold w-fit p-1 rounded"
                    href={`/admin/produksi/${produksi.id}/edit`}
                  >
                    <Icon
                      path={mdiArrowUpBoldBoxOutline}
                      size={1}
                      color="#fff"
                    />
                  </Link>
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold w-fit p-1 rounded"
                    onClick={() => handleDelete(produksi.id, "produksi")}
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
          <div
            className="bg-white p-4 rounded-lg w-1/2 h -1/2 overflow-y-auto z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-2">Deskripsi Produksi</h2>
            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-1">
                <p>Petani</p>
                <p>Produk</p>
                <p>jumlah</p>
                <p>Status</p>
              </div>
              <div className="col-span-3">
                <p>: {selectedProduksi?.petani}</p>
                <p>: {selectedProduksi?.produk}</p>
                <p>: {selectedProduksi?.jumlah}</p>
                <p>: {selectedProduksi?.status}</p>
              </div>
              <div className="col-span-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleUpdate(
                      Number(formData.get("id_update")),
                      formData.get("params") as string,
                      formData.get("status") as string
                    );
                  }}
                >
                  <label
                    className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                    htmlFor="status"
                  >
                    Status
                  </label>
                  <div className="">
                    <select
                      className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-3 text-sm outline-2 placeholder:text-gray-500`}
                      id="status"
                      name="status"
                      required
                      defaultValue={selectedProduksi?.status ?? ""}
                    >
                      <option value={""} disabled>
                        Pilih Status
                      </option>
                      {statusListOption.map((item, index: number) => (
                        <option key={index} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    id="params"
                    type="text"
                    name="params"
                    hidden
                    defaultValue={"produksi/status"}
                  />
                  <input
                    id="id_update"
                    type="text"
                    name="id_update"
                    hidden
                    defaultValue={selectedProduksi?.id}
                  />
                  <button
                    aria-disabled={pending}
                    className="mt-4 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded"
                  >
                    Submit
                  </button>
                </form>
              </div>
            </div>

            <button
              className="mt-4 bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
              onClick={() => setShowModal(!showModal)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div className="flex justify-center mt-5">
        <Pagination totalPages={totalItems} />
      </div>
    </div>
  );
}
