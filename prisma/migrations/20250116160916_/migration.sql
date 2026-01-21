/*
  Warnings:

  - Added the required column `jumlah` to the `Produk` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Produk" ADD COLUMN     "jumlah" INTEGER NOT NULL;
