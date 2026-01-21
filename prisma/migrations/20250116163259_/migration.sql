/*
  Warnings:

  - Added the required column `id_admin` to the `Petani` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_admin` to the `Produk` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_admin` to the `Produksi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Gambar" ADD COLUMN     "CocoblogId" INTEGER;

-- AlterTable
ALTER TABLE "Petani" ADD COLUMN     "id_admin" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Produk" ADD COLUMN     "id_admin" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Produksi" ADD COLUMN     "id_admin" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Cocoblog" (
    "id" SERIAL NOT NULL,
    "id_admin" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cocoblog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Petani" ADD CONSTRAINT "Petani_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produksi" ADD CONSTRAINT "Produksi_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produk" ADD CONSTRAINT "Produk_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cocoblog" ADD CONSTRAINT "Cocoblog_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gambar" ADD CONSTRAINT "Gambar_CocoblogId_fkey" FOREIGN KEY ("CocoblogId") REFERENCES "Cocoblog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
