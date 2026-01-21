"use client";

import { useState, useEffect } from "react";
import Icon from "@mdi/react";
import { mdiMapMarker, mdiAccount, mdiPhone, } from "@mdi/js";
import { Button } from "../button";
import { useFormStatus } from "react-dom";
import { formSubmitHandlerPetani } from "@/app/utils/actions";
import { useActionState } from "react";

export default function Table() {
  const [code, action] = useActionState(formSubmitHandlerPetani, undefined);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
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
        className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <p className="flex items-center">
          <span className="font-bold text-xl mr-1">+</span> Tambah Pembeli
        </p>
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
            <form action={action} className="space-y-3">
              <div className="flex-1  mr-5 p-10 md:mr-8 bg-white rounded-lg">
                <h1 className={`mb-3 text-2xl`}>Tambah Petani</h1>
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
                        className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${
                          errors.nama ? "border-red-500" : ""
                        }`}
                        id="nama"
                        type="text"
                        name="nama"
                        placeholder="Masukkan nama"
                        required
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
                      htmlFor="alamat"
                    >
                      Alamat
                    </label>
                    <div className="relative">
                      <input
                        className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${
                          errors.alamat ? "border-red-500" : ""
                        }`}
                        id="alamat"
                        type="text"
                        name="alamat"
                        placeholder="Masukkan alamat"
                        required
                      />
                      <Icon
                        path={mdiMapMarker}
                        size={1}
                        color="black"
                        className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
                      />
                    </div>
                    {errors.alamat && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.alamat}
                      </p>
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
                        className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${
                          errors.telepon ? "border-red-500" : ""
                        }`}
                        id="telepon"
                        type="number"
                        name="telepon"
                        placeholder="Masukkan no telepon pembeli"
                        required
                      />
                      <Icon
                        path={mdiPhone}
                        size={1}
                        color="black"
                        className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
                      />
                    </div>
                    {errors.telepon && (
                      <p className="text-red-500 text-sm mt -1">
                        {errors.telepon}
                      </p>
                    )}
                  </div>
                  <input
                    id="params"
                    type="text"
                    name="params"
                    hidden
                    defaultValue={"pembeli"}
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
