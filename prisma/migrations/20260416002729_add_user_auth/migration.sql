-- CreateTable: User
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Create a placeholder user to own orphan rows from before auth was added
INSERT INTO "User" ("email", "passwordHash", "name")
VALUES ('migrated@nutripixel.local', '$2a$12$placeholder', 'Migrated User');

-- Add userId columns (nullable first for backfill)
ALTER TABLE "Exercise" ADD COLUMN "userId" INTEGER;
ALTER TABLE "FoodLog" ADD COLUMN "userId" INTEGER;
ALTER TABLE "Goal" ADD COLUMN "userId" INTEGER;
ALTER TABLE "MoodEntry" ADD COLUMN "userId" INTEGER;
ALTER TABLE "Recipe" ADD COLUMN "userId" INTEGER;
ALTER TABLE "WeightEntry" ADD COLUMN "userId" INTEGER;

-- Backfill existing rows to the placeholder user
UPDATE "Exercise" SET "userId" = 1 WHERE "userId" IS NULL;
UPDATE "FoodLog" SET "userId" = 1 WHERE "userId" IS NULL;
UPDATE "Goal" SET "userId" = 1 WHERE "userId" IS NULL;
UPDATE "MoodEntry" SET "userId" = 1 WHERE "userId" IS NULL;
UPDATE "Recipe" SET "userId" = 1 WHERE "userId" IS NULL;
UPDATE "WeightEntry" SET "userId" = 1 WHERE "userId" IS NULL;

-- Make userId columns NOT NULL
ALTER TABLE "Exercise" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "FoodLog" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Goal" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "MoodEntry" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Recipe" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "WeightEntry" ALTER COLUMN "userId" SET NOT NULL;

-- Drop old unique constraints that don't include userId
DROP INDEX IF EXISTS "WeightEntry_date_key";
DROP INDEX IF EXISTS "MoodEntry_date_key";

-- Add compound unique constraints with userId
CREATE UNIQUE INDEX "WeightEntry_userId_date_key" ON "WeightEntry"("userId", "date");
CREATE UNIQUE INDEX "MoodEntry_userId_date_key" ON "MoodEntry"("userId", "date");

-- Add foreign keys
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FoodLog" ADD CONSTRAINT "FoodLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MoodEntry" ADD CONSTRAINT "MoodEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WeightEntry" ADD CONSTRAINT "WeightEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
