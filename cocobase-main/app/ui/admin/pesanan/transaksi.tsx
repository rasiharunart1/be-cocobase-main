"use client";

import { useState, useEffect } from "react";
import Icon from "@mdi/react";
import { mdiAccount, mdiCounter, mdiCash} from "@mdi/js";
import { Button } from "../button";
import { useFormStatus } from "react-dom";
import { formSubmitHandlerPetani } from "@/app/utils/actions";
import { useActionState } from "react";
import { ProdukSelect } from "@/app/utils/interface";

export default function TableTransaksi({
  idPembeli,
  namaPembeli,
  produk,
}: {
  idPembeli: number;
  namaPembeli: string;
  produk: ProdukSelect[];
}) {
  const [code, action] = useActionState(formSubmitHandlerPetani, undefined);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [produkList, setProdukList] = useState<ProdukSelect[]>([]);

  useEffect(() => {
    setProdukList(produk);
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
  }, [code]);

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="flex h-10 rounded-lg bg-[#E37D2E] font-bold text-xl mr-1 items-center p-3 text-white transition-colors hover:bg-[#be6b2c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#be6b2c]"
      >
        +
      </button>

      {showModal && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-gray-500 bg-opacity-75 flex justify-center items-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white p-4 rounded-lg w-1/2 h -1/2 overflow-y-auto z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <form action={action} className="">
              <div className="flex-1  mr-5 p-10 md:mr-8 w-full bg-white rounded-lg">
                <h1 className={`mb-3 text-2xl`}>Tambah Transaksi</h1>
                <div className="w-full">
                  <div>
                    <label
                      className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                      htmlFor="pembeli"
                    >
                      Nama Pembeli
                    </label>
                    <div className="relative">
                      <input
                        className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${
                          errors.nama ? "border-red-500" : ""
                        }`}
                        id="pembeli"
                        type="text"
                        name="pembeli"
                        value={namaPembeli}
                        disabled
                      />
                      <Icon
                        path={mdiAccount}
                        size={1}
                        color="black"
                        className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
                      />
                    </div>
                    {errors.namaPembeli && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.namaPembeli}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      className=" mt-5 block text-xs font-medium text-gray-900"
                      htmlFor="id_produk"
                    >
                      Produk
                    </label>
                    <div className="relative grid grid-cols-3  gap-3 justify-center items-center">
                      <div className="col-span-2 flex items-center">
                        <select
                          className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${
                            errors.id_produk ? "border-red-500" : ""
                          }`}
                          id="id_produk"
                          name="id_produk"
                          required
                          defaultValue={0}
                        >
                          <option value={0} disabled>
                            Pilih Produk
                          </option>
                          {produkList
                            .filter((item: ProdukSelect) =>
                              item.nama
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())
                            )
                            .map((item: ProdukSelect, index: number) => (
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
                          placeholder="Cari produk"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    {errors.id_produk && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.id_produk}
                      </p>
                    )}
                    {errors.searchTerm && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.searchTerm}
                      </p>
                    )}
                  </div>
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
                        type="text"
                        name="jumlah"
                        placeholder="Jumlah yang dibeli"
                        required
                      />
                      <Icon
                        path={mdiCounter}
                        size={1}
                        color="black"
                        className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
                      />
                    </div>
                    {errors.jumlah && (
                      <p className="text-red-500 text-sm mt-1">{errors.jumlah}</p>
                    )}
                  </div>
                  <div>
                    <label
                      className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                      htmlFor="harga"
                    >
                      Harga
                    </label>
                    <div className="relative">
                      <input
                        className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${
                          errors.harga ? "border-red-500" : ""
                        }`}
                        id="harga"
                        type="text"
                        name="harga"
                        placeholder="Masukkan harga"
                        required
                      />
                      <Icon
                        path={mdiCash}
                        size={1}
                        color="black"
                        className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
                      />
                    </div>
                    {errors.harga && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.harga}
                      </p>
                    )}
                  </div>
                  <input
                    id="params"
                    type="text"
                    name="params"
                    hidden
                    defaultValue={"transaksi"}
                  />
                  <input
                    id="id_pembeli"
                    type="text"
                    name="id_pembeli"
                    hidden
                    defaultValue={idPembeli}
                  />
                </div>
                <div className="flex flex-row gap-3 justify-end">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 active:bg-red-600 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 mt-4 bg-red-500 hover:bg-red-600 w-[15%] justify-center"
                  >
                    Close{" "}
                  </button>
                  <SubmitButton />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
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
