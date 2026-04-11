-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Goal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "goalType" TEXT NOT NULL DEFAULT 'lose',
    "targetWeight" REAL,
    "targetDate" TEXT,
    "targetCalories" REAL,
    "targetProtein" REAL,
    "targetCarbs" REAL,
    "targetFat" REAL,
    "minCarbs" REAL,
    "minFat" REAL,
    "minProtein" REAL,
    "proteinMode" TEXT NOT NULL DEFAULT 'minimum',
    "carbsMode" TEXT NOT NULL DEFAULT 'range',
    "fatMode" TEXT NOT NULL DEFAULT 'range',
    "unit" TEXT NOT NULL DEFAULT 'lbs',
    "height" REAL,
    "heightUnit" TEXT NOT NULL DEFAULT 'in',
    "gender" TEXT NOT NULL DEFAULT 'female',
    "age" INTEGER,
    "activityLevel" TEXT NOT NULL DEFAULT 'sedentary'
);
INSERT INTO "new_Goal" ("activityLevel", "age", "carbsMode", "fatMode", "gender", "height", "heightUnit", "id", "minCarbs", "minFat", "minProtein", "proteinMode", "targetCalories", "targetCarbs", "targetDate", "targetFat", "targetProtein", "targetWeight", "unit") SELECT "activityLevel", "age", "carbsMode", "fatMode", "gender", "height", "heightUnit", "id", "minCarbs", "minFat", "minProtein", "proteinMode", "targetCalories", "targetCarbs", "targetDate", "targetFat", "targetProtein", "targetWeight", "unit" FROM "Goal";
DROP TABLE "Goal";
ALTER TABLE "new_Goal" RENAME TO "Goal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
