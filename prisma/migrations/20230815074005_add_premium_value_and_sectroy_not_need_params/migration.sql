/*
  Warnings:

  - You are about to drop the column `xp` on the `Corporation_Builder` table. All the data in the column will be lost.
  - You are about to drop the column `count` on the `Builder` table. All the data in the column will be lost.
  - You are about to drop the column `xp` on the `Builder` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "xp" REAL NOT NULL DEFAULT 0,
    "gold" REAL NOT NULL DEFAULT 350,
    "crystal" INTEGER NOT NULL DEFAULT 0,
    "energy" REAL NOT NULL DEFAULT 0,
    "reputation" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'player',
    "limiter" INTEGER NOT NULL DEFAULT 0,
    "id_corporation" INTEGER NOT NULL DEFAULT 0,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("crdate", "energy", "gold", "id", "id_corporation", "idvk", "limiter", "lvl", "name", "reputation", "status", "update", "xp") SELECT "crdate", "energy", "gold", "id", "id_corporation", "idvk", "limiter", "lvl", "name", "reputation", "status", "update", "xp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE TABLE "new_Corporation_Builder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL,
    "income" REAL NOT NULL DEFAULT 1,
    "cost" REAL NOT NULL DEFAULT 100,
    "worker" INTEGER NOT NULL DEFAULT 1,
    "id_corporation" INTEGER NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Corporation_Builder_id_corporation_fkey" FOREIGN KEY ("id_corporation") REFERENCES "Corporation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Corporation_Builder" ("cost", "crdate", "id", "id_corporation", "income", "lvl", "name", "type", "update", "worker") SELECT "cost", "crdate", "id", "id_corporation", "income", "lvl", "name", "type", "update", "worker" FROM "Corporation_Builder";
DROP TABLE "Corporation_Builder";
ALTER TABLE "new_Corporation_Builder" RENAME TO "Corporation_Builder";
CREATE TABLE "new_Builder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL DEFAULT 'energy',
    "income" REAL NOT NULL DEFAULT 1,
    "cost" REAL NOT NULL DEFAULT 100,
    "worker" INTEGER NOT NULL DEFAULT 1,
    "id_user" INTEGER NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Builder_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Builder" ("cost", "crdate", "id", "id_user", "income", "lvl", "name", "type", "update", "worker") SELECT "cost", "crdate", "id", "id_user", "income", "lvl", "name", "type", "update", "worker" FROM "Builder";
DROP TABLE "Builder";
ALTER TABLE "new_Builder" RENAME TO "Builder";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
