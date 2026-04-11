-- CreateTable
CREATE TABLE "Exercise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "caloriesBurned" REAL NOT NULL,
    "duration" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Goal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "targetWeight" REAL,
    "targetCalories" REAL,
    "targetProtein" REAL,
    "targetCarbs" REAL,
    "targetFat" REAL,
    "unit" TEXT NOT NULL DEFAULT 'lbs',
    "height" REAL,
    "heightUnit" TEXT NOT NULL DEFAULT 'in',
    "gender" TEXT NOT NULL DEFAULT 'female',
    "age" INTEGER,
    "activityLevel" TEXT NOT NULL DEFAULT 'sedentary'
);
INSERT INTO "new_Goal" ("id", "targetCalories", "targetCarbs", "targetFat", "targetProtein", "targetWeight", "unit") SELECT "id", "targetCalories", "targetCarbs", "targetFat", "targetProtein", "targetWeight", "unit" FROM "Goal";
DROP TABLE "Goal";
ALTER TABLE "new_Goal" RENAME TO "Goal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
