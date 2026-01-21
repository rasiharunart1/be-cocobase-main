export interface SearchParams {
  limit?: number;
  page?: string;
  search?: string;
}

export interface Produksi {
  id: number;
  petani: string;
  produk: string;
  jumlah: number;
  status: string;
}

export interface ProduksiDetail {
  id: number;
  id_petani: number;
  petani: string;
  produk: string;
  jumlah: number;
  status: string;
}

export interface Petani {
  id: number;
  nama: string;
  alamat: string;
  no_hp: string;
  RT: string;
  RW: string;
}

export interface PetaniDetail {
  id: number;
  nama: string;
  alamat: string;
  no_hp: string;
  RT: string;
  RW: string;
  produksi: Produksi[];
}

export interface Produk {
  id: number;
  nama: string;
  gambar: string;
  link: string;
  deskripsi: string;
  jumlah: number;
}

export interface ProdukSelect {
  id: number;
  nama: string;
}

export interface Cocoblog {
  id: number;
  judul: string;
  isi: string;
  gambar: string;
}

export interface Kiri {
  nama: string;
  value: number;
  nilai: number;
}

export interface Kanan {
  nama: string;
  nilai: number;
}

export interface Transaksi {
  id: number;
  jumlah: number;
  harga: number;
  createdAt: string;
  updatedAt: string;
  produk: string;
  total: number;
}

export interface Pembeli {
  id: number;
  id_admin: number;
  nama: string;
  alamat: string;
  no_telp: string;
  createdAt: string;
  updatedAt: string;
  transaksi: Transaksi[];
}

export interface ChartSchema {
  id: number;
  id_admin: number;
  minggu_ke: number;
  bulan: number;
  tahun: number;
  jumlah_total: number;
  harga_rata: number;
}