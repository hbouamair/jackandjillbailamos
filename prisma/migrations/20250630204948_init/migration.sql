-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "judges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "judges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "heats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "heat_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "heatId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "heat_participants_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "heats" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "heat_participants_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rotations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "songType" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "heatId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rotations_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "heats" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "judgeId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "rotationId" TEXT,
    "heatId" TEXT,
    "phase" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "scores_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "judges" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "scores_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "scores_rotationId_fkey" FOREIGN KEY ("rotationId") REFERENCES "rotations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "scores_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "heats" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "competition_states" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currentPhase" TEXT NOT NULL DEFAULT 'HEATS',
    "semifinalists" TEXT NOT NULL,
    "finalists" TEXT NOT NULL,
    "winners" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "judges_username_key" ON "judges"("username");

-- CreateIndex
CREATE UNIQUE INDEX "judges_userId_key" ON "judges"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "heat_participants_heatId_participantId_key" ON "heat_participants"("heatId", "participantId");
