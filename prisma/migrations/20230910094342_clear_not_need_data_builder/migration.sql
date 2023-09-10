/*
  Warnings:

  - You are about to drop the column `cost` on the `Builder` table. All the data in the column will be lost.
  - You are about to drop the column `income` on the `Builder` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Builder` table. All the data in the column will be lost.
  - You are about to drop the column `worker` on the `Builder` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Builder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "costing" TEXT NOT NULL DEFAULT 'empty',
    "input" TEXT NOT NULL DEFAULT 'empty',
    "output" TEXT NOT NULL DEFAULT 'empty',
    "require" TEXT NOT NULL DEFAULT 'empty',
    "id_user" INTEGER NOT NULL,
    "id_planet" INTEGER,
    "upgradeble" BOOLEAN NOT NULL DEFAULT true,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Builder_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Builder" ("costing", "crdate", "id", "id_planet", "id_user", "input", "lvl", "name", "output", "require", "update", "upgradeble") SELECT "costing", "crdate", "id", "id_planet", "id_user", "input", "lvl", "name", "output", "require", "update", "upgradeble" FROM "Builder";
DROP TABLE "Builder";
ALTER TABLE "new_Builder" RENAME TO "Builder";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
