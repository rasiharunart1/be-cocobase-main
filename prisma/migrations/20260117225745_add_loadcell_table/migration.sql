-- CreateTable
CREATE TABLE "LoadcellReading" (
    "id" SERIAL NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoadcellReading_pkey" PRIMARY KEY ("id")
);
