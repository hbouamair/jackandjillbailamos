-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_competition_states" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currentPhase" TEXT NOT NULL DEFAULT 'HEATS',
    "activeHeatId" TEXT,
    "semifinalists" TEXT NOT NULL,
    "finalists" TEXT NOT NULL,
    "winners" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "competition_states_activeHeatId_fkey" FOREIGN KEY ("activeHeatId") REFERENCES "heats" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_competition_states" ("createdAt", "currentPhase", "finalists", "id", "semifinalists", "updatedAt", "winners") SELECT "createdAt", "currentPhase", "finalists", "id", "semifinalists", "updatedAt", "winners" FROM "competition_states";
DROP TABLE "competition_states";
ALTER TABLE "new_competition_states" RENAME TO "competition_states";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
