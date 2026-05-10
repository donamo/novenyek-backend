-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "googleSubject" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");

-- Legacy owner keeps existing MVP records valid after ownership becomes mandatory.
INSERT INTO "User" ("id", "googleSubject", "email", "displayName", "isEnabled", "updatedAt")
VALUES ('legacy-owner', 'legacy-owner', 'legacy@example.local', 'Legacy Owner', false, CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "Room" ADD COLUMN "ownerUserId" TEXT;
ALTER TABLE "Plant" ADD COLUMN "ownerUserId" TEXT;
ALTER TABLE "PlantRequirement" ADD COLUMN "ownerUserId" TEXT;
ALTER TABLE "PlantEvent" ADD COLUMN "ownerUserId" TEXT;
ALTER TABLE "PlantStatusReport" ADD COLUMN "ownerUserId" TEXT;
ALTER TABLE "PlantPhoto" ADD COLUMN "ownerUserId" TEXT;
ALTER TABLE "AiAnalysis" ADD COLUMN "ownerUserId" TEXT;

-- Backfill
UPDATE "Room" SET "ownerUserId" = 'legacy-owner' WHERE "ownerUserId" IS NULL;
UPDATE "Plant" SET "ownerUserId" = 'legacy-owner' WHERE "ownerUserId" IS NULL;
UPDATE "PlantRequirement" SET "ownerUserId" = 'legacy-owner' WHERE "ownerUserId" IS NULL;
UPDATE "PlantEvent" SET "ownerUserId" = 'legacy-owner' WHERE "ownerUserId" IS NULL;
UPDATE "PlantStatusReport" SET "ownerUserId" = 'legacy-owner' WHERE "ownerUserId" IS NULL;
UPDATE "PlantPhoto" SET "ownerUserId" = 'legacy-owner' WHERE "ownerUserId" IS NULL;
UPDATE "AiAnalysis" SET "ownerUserId" = 'legacy-owner' WHERE "ownerUserId" IS NULL;

-- Require ownership
ALTER TABLE "Room" ALTER COLUMN "ownerUserId" SET NOT NULL;
ALTER TABLE "Plant" ALTER COLUMN "ownerUserId" SET NOT NULL;
ALTER TABLE "PlantRequirement" ALTER COLUMN "ownerUserId" SET NOT NULL;
ALTER TABLE "PlantEvent" ALTER COLUMN "ownerUserId" SET NOT NULL;
ALTER TABLE "PlantStatusReport" ALTER COLUMN "ownerUserId" SET NOT NULL;
ALTER TABLE "PlantPhoto" ALTER COLUMN "ownerUserId" SET NOT NULL;
ALTER TABLE "AiAnalysis" ALTER COLUMN "ownerUserId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Room_ownerUserId_name_key" ON "Room"("ownerUserId", "name");
CREATE INDEX "Plant_ownerUserId_idx" ON "Plant"("ownerUserId");
CREATE INDEX "PlantEvent_ownerUserId_idx" ON "PlantEvent"("ownerUserId");
CREATE INDEX "PlantStatusReport_ownerUserId_idx" ON "PlantStatusReport"("ownerUserId");
CREATE INDEX "PlantPhoto_ownerUserId_idx" ON "PlantPhoto"("ownerUserId");
CREATE INDEX "AiAnalysis_ownerUserId_idx" ON "AiAnalysis"("ownerUserId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlantRequirement" ADD CONSTRAINT "PlantRequirement_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlantEvent" ADD CONSTRAINT "PlantEvent_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlantStatusReport" ADD CONSTRAINT "PlantStatusReport_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlantPhoto" ADD CONSTRAINT "PlantPhoto_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiAnalysis" ADD CONSTRAINT "AiAnalysis_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
