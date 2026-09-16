-- CreateTable
CREATE TABLE "ContractSnapshot" (
    "id" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "expiry" TEXT NOT NULL,
    "strike" INTEGER NOT NULL,
    "optionType" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "ltp" DOUBLE PRECISION,
    "oi" INTEGER,
    "volume" INTEGER,
    "iv" DOUBLE PRECISION,

    CONSTRAINT "ContractSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChainSnapshot" (
    "id" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "expiry" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "underlyingPrice" DOUBLE PRECISION NOT NULL,
    "pcr" DOUBLE PRECISION,
    "maxPain" DOUBLE PRECISION,

    CONSTRAINT "ChainSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractSnapshot_instrument_expiry_strike_optionType_captur_idx" ON "ContractSnapshot"("instrument", "expiry", "strike", "optionType", "capturedAt");

-- CreateIndex
CREATE INDEX "ChainSnapshot_instrument_expiry_capturedAt_idx" ON "ChainSnapshot"("instrument", "expiry", "capturedAt");
