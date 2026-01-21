"use client";
import Icon from "@mdi/react";
import { mdiImage, mdiTimerSand, } from "@mdi/js";
import { Button } from "../button";
import { useFormStatus } from "react-dom";
import { formSubmitHandlerFile } from "@/app/utils/actions";
import Link from "next/link";
import { useActionState, useState, useEffect } from "react";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

export default function LoginForm() {
  const [code, action] = useActionState(formSubmitHandlerFile, undefined);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [value, setValue] = useState<string | undefined>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);
      
      const token = localStorage.getItem("token");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cocoblog/upload-gambar`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      return data.data.gambar.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const onImagePaste = async (dataTransfer: DataTransfer): Promise<string> => {
    const files = dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        try {
          const imageUrl = await handleImageUpload(file);
          return imageUrl;
        } catch (error) {
          console.error("Error handling pasted image:", error);
          return "";
        }
      }
    }
    return "";
  };

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
    <form action={action} className="space-y-3">
      <div className="flex-1  mr-5 p-10 md:mr-8 bg-white rounded-lg">
        <h1 className={`mb-3 text-2xl`}>Tambah Cocoblog</h1>
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
                className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${
                  errors.nama ? "border-red-500" : ""
                }`}
                id="image"
                type="file"
                name="image"
                required
              />
              <Icon
                path={mdiImage}
                size={1}
                color="black"
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
              />
            </div>
          </div>
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="judul"
            >
              Judul
            </label>
            <div className="relative">
              <input
                className={`peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 ${
                  errors.judul ? "border-red-500" : ""
                }`}
                type="text"
                name="judul"
                placeholder="Judul"
                required
              />
              <Icon
                path={mdiTimerSand}
                size={1}
                color="black"
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
              />
            </div>
            {errors.judul && (
              <p className="text-red-500 text-sm mt-1">{errors.judul}</p>
            )}
          </div>
          <div>
          <label
            className="mb-3 mt-5 block text-xs font-medium text-gray-900"
            htmlFor="isi"
          >
            Deskripsi
          </label>
          <div className="relative" data-color-mode="light">
            <MDEditor
              value={value}
              onChange={(val) => setValue(val)}              
              className={`${errors.isi ? "border-red-500" : ""}`}
              height={200}
              onPaste={async (event) => {
                const clipboardData = event.clipboardData;
                const text = clipboardData.getData('text/plain');
                
                // Jika ada teks biasa yang di-paste
                if (text) {
                  event.preventDefault();
                  const cursorPosition = (event.target as HTMLTextAreaElement).selectionStart;
                  const newValue = value 
                    ? value.slice(0, cursorPosition) + text + value.slice(cursorPosition)
                    : text;
                  setValue(newValue);
                  return;
                }

                // Handle paste gambar seperti sebelumnya
                event.preventDefault();
                const imageUrl = await onImagePaste(clipboardData);
                if (imageUrl) {
                  const imageMarkdown = `![image](${imageUrl})`;
                  const newValue = value ? `${value}\n${imageMarkdown}` : imageMarkdown;
                  setValue(newValue);
                }
              }}
              onDrop={async (event) => {
                event.preventDefault();
                const imageUrl = await onImagePaste(event.dataTransfer);
                if (imageUrl) {
                  const imageMarkdown = `![image](${imageUrl})`;
                  const newValue = value ? `${value}\n${imageMarkdown}` : imageMarkdown;
                  setValue(newValue);
                }
              }}
            />
            <input type="hidden" name="isi" value={value || ""} />
            {uploadingImage && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <p>Mengupload gambar...</p>
              </div>
            )}
          </div>
          {errors.isi && (
            <p className="text-red-500 text-sm mt-1">{errors.isi}</p>
          )}
        </div>
        </div>
        <input
          id="params"
          type="text"
          name="params"
          hidden
          defaultValue={"cocoblog"}
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
      href="/admin/cocoblog"
      className="flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 active:bg-red-600 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 mt-4 bg-red-500 hover:bg-red-600 w-[15%] justify-center"
    >
      Cancel{" "}
    </Link>
  );
}
