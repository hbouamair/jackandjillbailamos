-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'JUDGE', 'MC');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('LEADER', 'FOLLOWER');

-- CreateEnum
CREATE TYPE "SongType" AS ENUM ('URBAN', 'SENSUAL', 'TRADITIONAL');

-- CreateEnum
CREATE TYPE "CompetitionPhase" AS ENUM ('HEATS', 'SEMIFINAL', 'FINAL');

-- CreateEnum
CREATE TYPE "CompetitionCategory" AS ENUM ('AMATEUR', 'PRO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "type" "UserType" NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "number" INTEGER NOT NULL,
    "pictureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "judges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "judges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heats" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "heats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heat_participants" (
    "id" TEXT NOT NULL,
    "heatId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "heat_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotations" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "songType" "SongType" NOT NULL,
    "duration" INTEGER NOT NULL,
    "heatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scores" (
    "id" TEXT NOT NULL,
    "judgeId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "rotationId" TEXT,
    "heatId" TEXT,
    "phase" "CompetitionPhase" NOT NULL,
    "score" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_states" (
    "id" TEXT NOT NULL,
    "currentPhase" "CompetitionPhase" NOT NULL DEFAULT 'HEATS',
    "category" "CompetitionCategory" NOT NULL DEFAULT 'AMATEUR',
    "activeHeatId" TEXT,
    "semifinalists" TEXT NOT NULL,
    "finalists" TEXT NOT NULL,
    "winners" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "participants_number_key" ON "participants"("number");

-- CreateIndex
CREATE UNIQUE INDEX "judges_username_key" ON "judges"("username");

-- CreateIndex
CREATE UNIQUE INDEX "judges_userId_key" ON "judges"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "heat_participants_heatId_participantId_key" ON "heat_participants"("heatId", "participantId");

-- AddForeignKey
ALTER TABLE "judges" ADD CONSTRAINT "judges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heat_participants" ADD CONSTRAINT "heat_participants_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "heats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heat_participants" ADD CONSTRAINT "heat_participants_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotations" ADD CONSTRAINT "rotations_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "heats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "judges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_rotationId_fkey" FOREIGN KEY ("rotationId") REFERENCES "rotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "heats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_states" ADD CONSTRAINT "competition_states_activeHeatId_fkey" FOREIGN KEY ("activeHeatId") REFERENCES "heats"("id") ON DELETE SET NULL ON UPDATE CASCADE;
