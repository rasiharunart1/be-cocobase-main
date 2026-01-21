-- CreateTable
CREATE TABLE "Scrap" (
    "id" SERIAL NOT NULL,
    "id_admin" INTEGER NOT NULL,
    "minggu_ke" INTEGER NOT NULL,
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "harga_rata" INTEGER NOT NULL,
    "jumlah_total" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scrap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Scrap_minggu_ke_bulan_tahun_key" ON "Scrap"("minggu_ke", "bulan", "tahun");

-- AddForeignKey
ALTER TABLE "Scrap" ADD CONSTRAINT "Scrap_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
