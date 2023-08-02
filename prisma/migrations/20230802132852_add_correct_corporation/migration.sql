/*
  Warnings:

  - You are about to drop the column `id_corportation` on the `Corporation` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Corporation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_user" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "xp" REAL NOT NULL DEFAULT 0,
    "gold" REAL NOT NULL DEFAULT 1750,
    "energy" REAL NOT NULL DEFAULT 1750,
    "reputation" REAL NOT NULL DEFAULT 0,
    "member" INTEGER NOT NULL DEFAULT 6,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Corporation" ("crdate", "energy", "gold", "id", "id_user", "lvl", "member", "name", "reputation", "update", "xp") SELECT "crdate", "energy", "gold", "id", "id_user", "lvl", "member", "name", "reputation", "update", "xp" FROM "Corporation";
DROP TABLE "Corporation";
ALTER TABLE "new_Corporation" RENAME TO "Corporation";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
