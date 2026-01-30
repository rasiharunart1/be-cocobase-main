-- CreateTable
CREATE TABLE "LaporanPetani" (
    "id" SERIAL NOT NULL,
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "jumlahPetani" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaporanPetani_pkey" PRIMARY KEY ("id")
);
