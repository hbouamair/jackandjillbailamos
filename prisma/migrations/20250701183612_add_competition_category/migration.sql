-- CreateEnum
CREATE TYPE "CompetitionCategory" AS ENUM ('AMATEUR', 'PRO');

-- AlterTable
ALTER TABLE "competition_states" ADD COLUMN     "category" "CompetitionCategory" NOT NULL DEFAULT 'AMATEUR';
