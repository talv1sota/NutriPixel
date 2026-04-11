/*
  Warnings:

  - You are about to drop the column `bloat` on the `MoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `energy` on the `MoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `hunger` on the `MoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `mood` on the `MoodEntry` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MoodEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_MoodEntry" ("createdAt", "date", "id", "notes") SELECT "createdAt", "date", "id", "notes" FROM "MoodEntry";
DROP TABLE "MoodEntry";
ALTER TABLE "new_MoodEntry" RENAME TO "MoodEntry";
CREATE UNIQUE INDEX "MoodEntry_date_key" ON "MoodEntry"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
