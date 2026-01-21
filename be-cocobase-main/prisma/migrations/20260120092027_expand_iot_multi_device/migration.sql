/*
  Warnings:

  - You are about to drop the `LoadcellConfig` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `deviceId` to the `LoadcellReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceId` to the `PackingLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LoadcellReading" ADD COLUMN     "deviceId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PackingLog" ADD COLUMN     "deviceId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "LoadcellConfig";

-- CreateTable
CREATE TABLE "Device" (
    "id" SERIAL NOT NULL,
    "id_admin" INTEGER,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_token_key" ON "Device"("token");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadcellReading" ADD CONSTRAINT "LoadcellReading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingLog" ADD CONSTRAINT "PackingLog_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
