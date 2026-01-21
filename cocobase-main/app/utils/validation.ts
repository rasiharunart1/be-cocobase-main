import { z } from "zod";

export const petani = z.object({
  nama: z.string().min(1, { message: "Nama petani harus diisi" }),
  alamat: z.string().min(1, { message: "Alamat harus diisi" }),
  telepon: z
    .string()
    .min(10, { message: "Nomor telepon harus minimal 10 digit" }),
  RT: z.string().min(1, { message: "RT harus diisi" }),
  RW: z.string().min(1, { message: "RW harus diisi" }),
});

export const produksi = z.object({
  id_petani: z.string(),
  produk: z.string().min(1, { message: "Nama produk harus diisi" }),
  jumlah: z.string().min(1),
  status: z.optional(z.enum(["DIAYAK", "DIOVEN", "DISORTIR", "DIKEMAS", "SELESAI"])),
});

export const transaksi = z.object({
  id_pembeli: z.string(),
  id_produk: z.string().min(1, { message: "Pilih produk" }),
  jumlah: z.string().min(1, { message: "Jumlah harus diisi" }),
  harga: z.string().min(1, { message: "Harga harus diisi" }),
});

export const cocoblog = z.object({
  judul: z.string().min(1, { message: "Judul harus diisi" }),
  isi: z.string().min(1, { message: "Deksripsi harus diisi" }),
});

export const produk = z.object({
  nama: z.string().min(1, { message: "Judul harus diisi" }),
  deskripsi: z.string().min(1, { message: "Deksripsi harus diisi" }),
  link: z.string().min(1, { message: "Deksripsi harus diisi" }),
});

export const statusProduksi = z.object({
  status: z.optional(z.enum(["DIAYAK", "DIOVEN", "DISORTIR", "DIKEMAS", "SELESAI"])),
});

export const produksiUpdate = z.object({
  id_petani: z.string(),
  produk: z.string().min(1, { message: "Nama produk harus diisi" }),
  jumlah: z.string().min(1),
  status: z.enum(["DIAYAK", "DIOVEN", "DISORTIR", "DIKEMAS", "SELESAI"]),
});
