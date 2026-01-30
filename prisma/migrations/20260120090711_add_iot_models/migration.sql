-- CreateTable
CREATE TABLE "LoadcellConfig" (
    "id" SERIAL NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadcellConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingLog" (
    "id" SERIAL NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackingLog_pkey" PRIMARY KEY ("id")
);
