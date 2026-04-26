-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "realtorName" TEXT NOT NULL,
    "realtorEmail" TEXT,
    "realtorPhone" TEXT,
    "closingDate" DATETIME,
    "propertyId" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "inspectorId" TEXT,
    "inspectorStaticId" TEXT,
    "inspectorName" TEXT,
    "inspectorCompany" TEXT,
    "inspectorPhone" TEXT,
    "inspectorEmail" TEXT,
    "inspectorSlotLabel" TEXT,
    "scheduledFor" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "feeUSDPaid" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "Inspector" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("closingDate", "createdAt", "id", "inspectorId", "jurisdictionId", "propertyId", "realtorEmail", "realtorName", "realtorPhone", "scheduledFor", "status", "stripePaymentId", "updatedAt") SELECT "closingDate", "createdAt", "id", "inspectorId", "jurisdictionId", "propertyId", "realtorEmail", "realtorName", "realtorPhone", "scheduledFor", "status", "stripePaymentId", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
