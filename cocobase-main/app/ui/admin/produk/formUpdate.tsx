"use client";
import Icon from "@mdi/react";
import { mdiImage, mdiTimerSand, mdiLink, mdiTextBoxOutline, mdiCash } from "@mdi/js";
import { Button } from "../button";
import { useFormStatus } from "react-dom";
import { formSubmitHandlerFile } from "@/app/utils/actions";
import Link from "next/link";
import { useActionState, useState, useEffect } from "react";
import { Produk } from "@/app/utils/interface";
import { getData } from "@/app/utils/fetchData";

export default function FormUpdate({ id }: { id: string }) {
  const [code, action] = useActionState(formSubmitHandlerFile, undefined);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [list, setList] = useState<Produk>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getData({
          path: `/produk/${id}`,
        });

        setList(data);
      } catch (error) {
        console.error(error);
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
  }, [code]);

  return (
    <form action={action} className="space-y-3">
      <div className="flex-1  mr-5 p-10 md:mr-8 bg-white rounded-lg">
        <h1 className={`mb-3 text-2xl`}>Edit Produk</h1>
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="image"
            >
              Gambar
            </label>
            <div className="relative">
              <input
                className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${errors.image ? "border-red-500" : ""
                  }`}
                id="image"
                type="file"
                name="image"
              />
              <Icon
                path={mdiImage}
                size={1}
                color="black"
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
              />
            </div>
            <p className="text-gray-600 text-sm mt-1"><span className="text-red-700 text-xl">*</span>Jika tidak ingin mengganti gambar, abaikan saja.</p>
          </div>
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="nama"
            >
              Nama
            </label>
            <div className="relative">
              <input
                className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${errors.nama ? "border-red-500" : ""
                  }`}
                id="nama"
                type="text"
                name="nama"
                placeholder="Judul"
                required
                defaultValue={list?.nama ?? ""}
              />
              <Icon
                path={mdiTimerSand}
                size={1}
                color="black"
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
              />
            </div>
            {errors.nama && (
              <p className="text-red-500 text-sm mt-1">{errors.nama}</p>
            )}
          </div>
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="deskripsi"
            >
              Deskripsi
            </label>
            <div className="relative">
              <textarea
                className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${errors.deskripsi ? "border-red-500" : ""
                  }`}
                id="deskripsi"
                name="deskripsi"
                placeholder="Deskripsi"
                required
                defaultValue={list?.deskripsi}
              />
              <Icon
                path={mdiTextBoxOutline}
                size={1}
                color="black"
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
              />
            </div>
            {errors.deskripsi && (
              <p className="text-red-500 text-sm mt-1">{errors.deskripsi}</p>
            )}
          </div>
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="link"
            >
              Link Penjualan Produk
            </label>
            <div className="relative">
              <input
                className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${errors.link ? "border-red-500" : ""
                  }`}
                id="link"
                type="text"
                name="link"
                placeholder="Link Penjualan Produk"
                required
                defaultValue={list?.link}
              />
              <Icon
                path={mdiLink}
                size={1}
                color="black"
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
              />
            </div>
            {errors.link && (
              <p className="text-red-500 text-sm mt-1">{errors.link}</p>
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
                className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${errors.harga ? "border-red-500" : ""
                  }`}
                id="harga"
                type="number"
                name="harga"
                placeholder="Harga (Rp)"
                required
                defaultValue={list?.harga}
              />
              <Icon
                path={mdiCash}
                size={1}
                color="black"
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
              />
            </div>
            {errors.harga && (
              <p className="text-red-500 text-sm mt-1">{errors.harga}</p>
            )}
          </div>

          {/* Jumlah (Quantity) */}
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="jumlah"
            >
              Jumlah Stok
            </label>
            <div className="relative">
              <input
                className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${errors.jumlah ? "border-red-500" : ""
                  }`}
                id="jumlah"
                type="number"
                name="jumlah"
                placeholder="Jumlah Stok"
                defaultValue={list?.jumlah ?? 0}
              />
              <Icon
                path={mdiCash}
                size={1}
                color="black"
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
              />
            </div>
            {errors.jumlah && (
              <p className="text-red-500 text-sm mt-1">{errors.jumlah}</p>
            )}
          </div>

          {/* Unit Type */}
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="unit"
            >
              Satuan Produk
            </label>
            <div className="relative">
              <select
                className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-3 text-sm outline-2 ${errors.unit ? "border-red-500" : ""
                  }`}
                id="unit"
                name="unit"
                defaultValue={list?.unit ?? "KG"}
              >
                <option value="KG">Kilogram (KG)</option>
                <option value="POUCH">Pouch / Kemasan</option>
              </select>
            </div>
            {errors.unit && (
              <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
            )}
          </div>
        </div>
        <input
          id="id_update"
          type="text"
          name="id_update"
          hidden
          defaultValue={id}
        />
        <input
          id="params"
          type="text"
          name="params"
          hidden
          defaultValue={"produk"}
        />
        <div className="flex flex-row gap-3 justify-end">
          <CancelButton />
          <SubmitButton />
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
      href="/admin/produk"
      className="flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 active:bg-red-600 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 mt-4 bg-red-500 hover:bg-red-600 w-[15%] justify-center"
    >
      Cancel{" "}
    </Link>
  );
}
