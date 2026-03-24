-- CreateTable
CREATE TABLE "ProductionLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceProductId" TEXT NOT NULL,
    "sourceQuantity" INTEGER NOT NULL,
    "targetProductId" TEXT NOT NULL,
    "targetQuantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_targetProductId_fkey" FOREIGN KEY ("targetProductId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
