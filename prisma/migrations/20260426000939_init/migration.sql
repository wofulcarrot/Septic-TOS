-- CreateTable
CREATE TABLE "Jurisdiction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "countyName" TEXT NOT NULL,
    "countyFips" TEXT NOT NULL,
    "authorityCode" TEXT NOT NULL,
    "authorityName" TEXT NOT NULL,
    "formName" TEXT NOT NULL,
    "feeUSD" INTEGER NOT NULL,
    "feeIsEstimate" BOOLEAN NOT NULL DEFAULT true,
    "submissionMethod" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Inspector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "earliestAvailable" DATETIME NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inspector_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rawAddress" TEXT NOT NULL,
    "formattedAddress" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "countyFips" TEXT,
    "withinSurfaceWater" BOOLEAN,
    "jurisdictionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "realtorName" TEXT NOT NULL,
    "realtorEmail" TEXT,
    "realtorPhone" TEXT,
    "closingDate" DATETIME NOT NULL,
    "propertyId" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "inspectorId" TEXT,
    "scheduledFor" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "stripePaymentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "Inspector" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Jurisdiction_countyFips_key" ON "Jurisdiction"("countyFips");

-- CreateIndex
CREATE UNIQUE INDEX "Jurisdiction_authorityCode_key" ON "Jurisdiction"("authorityCode");
