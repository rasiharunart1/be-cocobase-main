"use client";

import { useState, useEffect, useActionState } from "react";
import Icon from "@mdi/react";
import { mdiAccount, mdiTimerSand, mdiCounter } from "@mdi/js";
import { Button } from "../button";
import { useFormStatus } from "react-dom";
import { formSubmitHandlerPetani } from "@/app/utils/actions";
import Link from "next/link";
import { getDataNoQuery, getData } from "@/app/utils/fetchData";
import { Petani, ProduksiDetail } from "@/app/utils/interface";

export default function TableUpdate({ id }: { id: string }) {
  const [code, action] = useActionState(formSubmitHandlerPetani, undefined);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [petaniList, setPetaniList] = useState<Petani[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [produksiList, setProduksiList] = useState<ProduksiDetail>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dataPetani = await getDataNoQuery({
          path: "/petani",
        });

        if (dataPetani.length === 0) {
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
          setPetaniList(dataPetani.petani);
        }

        const dataProduksi = await getData({
          path: `/produksi/${id}`,
        });

        setProduksiList(dataProduksi);
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

    if (code !== undefined && code.success === false) {
      const errors: { [key: string]: string } = {};
      if (Array.isArray(code.message)) {
        code.message.forEach((error: { path: string[]; message: string }) => {
          errors[error.path.join(".")] = error.message;
        });
      } else if (code.message) {
        errors.message = code.message;
      } else {
        errors.message = "Form submission failed";
      }
      setErrors(errors);
    }
  }, [code, id]);

  const statusList = [
    { value: "", label: "Status" },
    { value: "DIAYAK", label: "Diayak" },
    { value: "DIOVEN", label: "Dioven" },
    { value: "DISORTIR", label: "Disortir" },
    { value: "DIKEMAS", label: "Dikemas" },
    { value: "SELESAI", label: "Selesai" },
  ];

  return (
    <form action={action} className="space-y-3">
      <div className="flex-1  mr-5 p-10 md:mr-8 bg-white rounded-lg">
        <h1 className={`mb-3 text-2xl`}>
          Edit Produksi {produksiList?.petani}
        </h1>
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="id_petani"
            >
              Petani
            </label>
            <div className="relative grid grid-cols-3  gap-3 justify-center items-center">
              <div className="col-span-2 flex items-center">
                <select
                  className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${
                    errors.id_petani ? "border-red-500" : ""
                  }`}
                  id="id_petani"
                  name="id_petani"
                  required
                  defaultValue={0}
                >
                  <option value={0} disabled>
                    Pilih Petani
                  </option>
                  {petaniList
                    .filter((item: Petani) =>
                      item.nama.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((item: Petani, index: number) => (
                      <option key={index} value={item.id}>
                        {item.nama}
                      </option>
                    ))}
                </select>
                <Icon
                  path={mdiAccount}
                  size={1}
                  color="black"
                  className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
                />
              </div>
              <div className="col-span-1 mt-[12px]">
                <input
                  className={`peer block w-full rounded-md border border-gray-200 py-[10px] pl-4 text-sm outline-2 placeholder:text-gray-500 mb-3 ${
                    errors.searchTerm ? "border-red-500" : ""
                  }`}
                  type="text"
                  placeholder="Cari Petani"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {errors.id_petani && (
              <p className="text-red-500 text-sm mt-1">{errors.id_petani}</p>
            )}
            {errors.searchTerm && (
              <p className="text-red-500 text-sm mt-1">{errors.searchTerm}</p>
            )}
          </div>
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="status"
            >
              Status
            </label>
            <div className="relative grid grid-cols-3  gap-3 justify-center items-center">
              <div className="col-span-2 flex items-center">
                <select
                  className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500`}
                  id="status"
                  name="status"
                  required
                  defaultValue={produksiList?.status ?? ""}
                >
                  <option value={0} disabled>
                    Pilih Status
                  </option>
                  {statusList.map((item, index: number) => (
                    <option key={index} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <Icon
                  path={mdiAccount}
                  size={1}
                  color="black"
                  className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
                />
              </div>
            </div>
          </div>
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="produk"
            >
              Produk
            </label>
            <div className="relative">
              <input
                className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${
                  errors.produk ? "border-red-500" : ""
                }`}
                id="produk"
                type="text"
                name="produk"
                placeholder="Masukkan nama produksi"
                required
                defaultValue={produksiList?.produk ?? ""}
              />
              <Icon
                path={mdiTimerSand}
                size={1}
                color="black"
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
              />
            </div>
            {errors.produk && (
              <p className="text-red-500 text-sm mt-1">{errors.produk}</p>
            )}
          </div>
          <div className="w-full">
            <div>
              <label
                className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                htmlFor="jumlah"
              >
                Jumlah
              </label>
              <div className="relative">
                <input
                  className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${
                    errors.jumlah ? "border-red-500" : ""
                  }`}
                  id="jumlah"
                  type="number"
                  name="jumlah"
                  placeholder="Jumlah produksi"
                  required
                  defaultValue={produksiList?.jumlah ?? 0}
                />
                <Icon
                  path={mdiCounter}
                  size={1}
                  color="black"
                  className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
                />
              </div>
            </div>
            <input
              id="params"
              type="text"
              name="params"
              hidden
              defaultValue={"produksi"}
            />
            <input
              id="id_update"
              type="text"
              name="id_update"
              hidden
              defaultValue={id}
            />
          </div>
          <div className="flex flex-row gap-3 justify-end">
            <CancelButton />
            <SubmitButton />
          </div>
        </div>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="mt-4 bg-green-500 hover:bg-green-600 w-[15%] justify-center focus-visible:outline-green-500 active:bg-green-600"
      aria-disabled={pending}
    >
      Simpan
    </Button>
  );
}

function CancelButton() {
  return (
    <Link
      href="/admin/produksi"
      className="flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 active:bg-red-600 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 mt-4 bg-red-500 hover:bg-red-600 w-[15%] justify-center"
    >
      Cancel{" "}
    </Link>
  );
}
