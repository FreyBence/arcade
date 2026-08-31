ALTER TABLE "users" DROP COLUMN "profileIcon",
ADD COLUMN "profileImage" TEXT;

DROP TYPE "ProfileIcon";
