-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "aciklama" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "aciklama" TEXT,
    "birim" TEXT NOT NULL DEFAULT 'adet',
    "fiyat" DOUBLE PRECISION NOT NULL,
    "stokMiktari" INTEGER NOT NULL DEFAULT 0,
    "minStokSeviyesi" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_ad_key" ON "Category"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
