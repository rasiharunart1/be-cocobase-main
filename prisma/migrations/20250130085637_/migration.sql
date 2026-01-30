/*
  Warnings:

  - Added the required column `RT` to the `Petani` table without a default value. This is not possible if the table is not empty.
  - Added the required column `RW` to the `Petani` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Petani" ADD COLUMN     "RT" TEXT NOT NULL,
ADD COLUMN     "RW" TEXT NOT NULL;
