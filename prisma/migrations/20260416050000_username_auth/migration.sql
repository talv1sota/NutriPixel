-- Rename email to username
ALTER TABLE "User" RENAME COLUMN "email" TO "username";

-- Drop the old index and create new one
DROP INDEX IF EXISTS "User_email_key";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Drop name column (no longer needed)
ALTER TABLE "User" DROP COLUMN IF EXISTS "name";
