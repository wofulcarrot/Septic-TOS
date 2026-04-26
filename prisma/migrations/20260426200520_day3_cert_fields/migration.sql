-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "certEscalationsJson" TEXT;
ALTER TABLE "Booking" ADD COLUMN "certGeneratedAt" DATETIME;
ALTER TABLE "Booking" ADD COLUMN "certInspectionPass" BOOLEAN;
ALTER TABLE "Booking" ADD COLUMN "certPdfPath" TEXT;
ALTER TABLE "Booking" ADD COLUMN "certSystemNotes" TEXT;
