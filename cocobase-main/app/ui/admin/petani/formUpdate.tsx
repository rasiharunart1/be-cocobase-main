"use client";

import { useState, useEffect } from "react";
import Icon from "@mdi/react";
import { mdiMapMarker, mdiAccount, mdiPhone, mdiLock } from "@mdi/js";
import { Button } from "../button";
import { useFormStatus } from "react-dom";
import { formSubmitHandlerPetani } from "@/app/utils/actions";
import Link from "next/link";
import { useActionState } from "react";
import { getData } from "@/app/utils/fetchData";
import { Petani } from "@/app/utils/interface";

export default function TableUpdate({ id }: { id: string }) {
  const [code, action] = useActionState(formSubmitHandlerPetani, undefined);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [petaniList, setPetaniList] = useState<Petani>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getData({
          path: `/petani/${id}`,
        });

        setPetaniList(data);
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
        <h1 className={`mb-3 text-2xl`}>Edit Petani</h1>
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="nama"
            >
              Nama Petani
            </label>
            <div className="relative">
              <input
                className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${errors.nama ? "border-red-500" : ""
                  }`}
                id="nama"
                type="text"
                name="nama"
                placeholder="Masukkan nama petani"
                required
                defaultValue={petaniList?.nama ?? ""}
              />
              <Icon
                path={mdiAccount}
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
              htmlFor="password"
            >
              Password (Optional)
            </label>
            <div className="relative">
              <input
                className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${errors.password ? "border-red-500" : ""
                  }`}
                id="password"
                type="password"
                name="password"
                placeholder="Kosongkan jika tidak ingin mengubah password"
              />
              <Icon
                path={mdiLock}
                size={1}
                color="black"
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>
          <div className="flex flex-row gap-3">
            <div>
              <label
                className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                htmlFor="RT"
              >
                RT
              </label>
              <div className="relative">
                <input
                  className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${errors.RT ? "border-red-500" : ""
                    }`}
                  id="RT"
                  type="number"
                  name="RT"
                  placeholder="Masukkan RT petani"
                  required
                  defaultValue={petaniList?.RT ?? ""}
                />
                <Icon
                  path={mdiMapMarker}
                  size={1}
                  color="black"
                  className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
                />
              </div>
              {errors.RT && (
                <p className="text-red-500 text-sm mt -1">{errors.RT}</p>
              )}
            </div>

            <div>
              <label
                className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                htmlFor="RW"
              >
                RW
              </label>
              <div className="relative">
                <input
                  className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${errors.RW ? "border-red-500" : ""
                    }`}
                  id="RW"
                  type="number"
                  name="RW"
                  placeholder="Masukkan RW petani"
                  required
                  defaultValue={petaniList?.RW ?? ""}
                />
                <Icon
                  path={mdiMapMarker}
                  size={1}
                  color="black"
                  className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
                />
              </div>
              {errors.RW && (
                <p className="text-red-500 text-sm mt -1">{errors.RW}</p>
              )}
            </div>
          </div>
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="alamat"
            >
              Alamat
            </label>
            <div className="relative">
              <input
                className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${errors.alamat ? "border-red-500" : ""
                  }`}
                id="alamat"
                type="text"
                name="alamat"
                placeholder="Masukkan alamat petani"
                required
                defaultValue={petaniList?.alamat ?? ""}
              />
              <Icon
                path={mdiMapMarker}
                size={1}
                color="black"
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
              />
            </div>
            {errors.alamat && (
              <p className="text-red-500 text-sm mt-1">{errors.alamat}</p>
            )}
          </div>
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="telepon"
            >
              No Telepon
            </label>
            <div className="relative">
              <input
                className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${errors.telepon ? "border-red-500" : ""
                  }`}
                id="telepon"
                type="number"
                name="telepon"
                placeholder="Masukkan no telepon petani"
                required
                defaultValue={petaniList?.no_hp ?? ""}
              />
              <Icon
                path={mdiPhone}
                size={1}
                color="black"
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
              />
            </div>
            {errors.telepon && (
              <p className="text-red-500 text-sm mt -1">{errors.telepon}</p>
            )}
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
            defaultValue={"petani"}
          />
        </div>
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
      href="/admin/petani"
      className="flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 active:bg-red-600 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 mt-4 bg-red-500 hover:bg-red-600 w-[15%] justify-center"
    >
      Cancel{" "}
    </Link>
  );
}
