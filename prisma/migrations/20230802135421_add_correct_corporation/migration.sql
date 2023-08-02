/*
  Warnings:

  - You are about to drop the column `koef` on the `Corporation_Builder` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Corporation_Builder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "xp" REAL NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "income" REAL NOT NULL DEFAULT 1,
    "cost" REAL NOT NULL DEFAULT 100,
    "worker" INTEGER NOT NULL DEFAULT 1,
    "id_corporation" INTEGER NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Corporation_Builder_id_corporation_fkey" FOREIGN KEY ("id_corporation") REFERENCES "Corporation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Corporation_Builder" ("cost", "crdate", "id", "id_corporation", "lvl", "name", "type", "update", "xp") SELECT "cost", "crdate", "id", "id_corporation", "lvl", "name", "type", "update", "xp" FROM "Corporation_Builder";
DROP TABLE "Corporation_Builder";
ALTER TABLE "new_Corporation_Builder" RENAME TO "Corporation_Builder";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
