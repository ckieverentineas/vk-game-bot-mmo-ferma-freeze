/*
  Warnings:

  - You are about to drop the column `costing` on the `Builder` table. All the data in the column will be lost.
  - You are about to drop the column `input` on the `Builder` table. All the data in the column will be lost.
  - You are about to drop the column `output` on the `Builder` table. All the data in the column will be lost.
  - You are about to drop the column `require` on the `Builder` table. All the data in the column will be lost.
  - You are about to drop the column `upgradeble` on the `Builder` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Builder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "id_user" INTEGER NOT NULL,
    "id_planet" INTEGER,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Builder_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Builder" ("crdate", "id", "id_planet", "id_user", "lvl", "name", "update") SELECT "crdate", "id", "id_planet", "id_user", "lvl", "name", "update" FROM "Builder";
DROP TABLE "Builder";
ALTER TABLE "new_Builder" RENAME TO "Builder";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
