-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoomOrientation" AS ENUM ('north', 'south', 'east', 'west', 'mixed');

-- CreateEnum
CREATE TYPE "LightLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "HumidityLevel" AS ENUM ('low', 'normal', 'high');

-- CreateEnum
CREATE TYPE "PlantSize" AS ENUM ('small', 'medium', 'large');

-- CreateEnum
CREATE TYPE "PlantStatus" AS ENUM ('active', 'inactive', 'dead', 'gifted');

-- CreateEnum
CREATE TYPE "PlantEventType" AS ENUM ('watering', 'repotting', 'fertilizing', 'pruning', 'move', 'treatment', 'note', 'photo', 'ai_analysis');

-- CreateEnum
CREATE TYPE "OverallStatus" AS ENUM ('good', 'medium', 'bad', 'unknown');

-- CreateEnum
CREATE TYPE "PestSuspicion" AS ENUM ('none', 'possible', 'yes', 'unknown');

-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('openai', 'gemini', 'openrouter', 'mock');

-- CreateEnum
CREATE TYPE "AiConfidence" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orientation" "RoomOrientation",
    "lightLevel" "LightLevel",
    "humidityLevel" "HumidityLevel",
    "averageTemperature" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "species" TEXT,
    "category" TEXT,
    "size" "PlantSize",
    "potSizeCm" INTEGER,
    "roomId" TEXT,
    "locationDescription" TEXT,
    "acquiredAt" TIMESTAMP(3),
    "acquiredFrom" TEXT,
    "status" "PlantStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantRequirement" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "lightNeed" TEXT,
    "waterNeed" TEXT,
    "humidityNeed" TEXT,
    "temperatureNeed" TEXT,
    "soilNeed" TEXT,
    "fertilizingNeed" TEXT,
    "repottingFrequency" TEXT,
    "commonProblems" TEXT,
    "toxicity" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantEvent" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "type" "PlantEventType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantStatusReport" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "reportMonth" TEXT NOT NULL,
    "overallStatus" "OverallStatus" NOT NULL DEFAULT 'unknown',
    "leafStatus" TEXT,
    "growthStatus" TEXT,
    "soilStatus" TEXT,
    "pestSuspicion" "PestSuspicion",
    "wateringAssessment" TEXT,
    "lightAssessment" TEXT,
    "notes" TEXT,
    "aiSummary" TEXT,
    "aiRecommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantStatusReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantPhoto" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "statusReportId" TEXT,
    "filePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "originalFilename" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "takenAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caption" TEXT,

    CONSTRAINT "PlantPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAnalysis" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "statusReportId" TEXT,
    "provider" "AiProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputPhotoIds" JSONB NOT NULL,
    "rawResponse" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "confidence" "AiConfidence",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlantRequirement_plantId_key" ON "PlantRequirement"("plantId");

-- CreateIndex
CREATE UNIQUE INDEX "PlantStatusReport_plantId_reportMonth_key" ON "PlantStatusReport"("plantId", "reportMonth");

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantRequirement" ADD CONSTRAINT "PlantRequirement_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantEvent" ADD CONSTRAINT "PlantEvent_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantStatusReport" ADD CONSTRAINT "PlantStatusReport_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantPhoto" ADD CONSTRAINT "PlantPhoto_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantPhoto" ADD CONSTRAINT "PlantPhoto_statusReportId_fkey" FOREIGN KEY ("statusReportId") REFERENCES "PlantStatusReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAnalysis" ADD CONSTRAINT "AiAnalysis_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAnalysis" ADD CONSTRAINT "AiAnalysis_statusReportId_fkey" FOREIGN KEY ("statusReportId") REFERENCES "PlantStatusReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
