CREATE TYPE "ProfileIcon" AS ENUM ('dino', 'rocket', 'alien', 'joystick', 'trophy', 'star');
ALTER TABLE "users" ADD COLUMN "profileIcon" "ProfileIcon" NOT NULL DEFAULT 'dino';
