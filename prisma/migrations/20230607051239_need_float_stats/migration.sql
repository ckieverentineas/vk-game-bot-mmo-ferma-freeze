/*
  Warnings:

  - You are about to drop the column `limit` on the `Office` table. All the data in the column will be lost.
  - You are about to alter the column `xp` on the `Office` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `xp` on the `Worker` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `boost` on the `Factory` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `energy` on the `Factory` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `energy_per` on the `Factory` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `xp` on the `Factory` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `energy` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `gold` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `xp` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Office" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "xp" REAL NOT NULL DEFAULT 0,
    "id_user" INTEGER NOT NULL,
    CONSTRAINT "Office_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Office" ("id", "id_user", "lvl", "xp") SELECT "id", "id_user", "lvl", "xp" FROM "Office";
DROP TABLE "Office";
ALTER TABLE "new_Office" RENAME TO "Office";
CREATE TABLE "new_Worker" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "strength" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "agility" INTEGER NOT NULL,
    "stamina" INTEGER NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "xp" REAL NOT NULL DEFAULT 0,
    "point" INTEGER NOT NULL,
    "id_factory" INTEGER NOT NULL,
    CONSTRAINT "Worker_id_factory_fkey" FOREIGN KEY ("id_factory") REFERENCES "Factory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Worker" ("agility", "id", "id_factory", "lvl", "point", "speed", "stamina", "strength", "xp") SELECT "agility", "id", "id_factory", "lvl", "point", "speed", "stamina", "strength", "xp" FROM "Worker";
DROP TABLE "Worker";
ALTER TABLE "new_Worker" RENAME TO "Worker";
CREATE TABLE "new_Factory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "xp" REAL NOT NULL DEFAULT 0,
    "energy" REAL NOT NULL DEFAULT 0,
    "energy_per" REAL NOT NULL DEFAULT 0,
    "boost" REAL NOT NULL DEFAULT 1,
    "limit" INTEGER NOT NULL DEFAULT 1,
    "id_office" INTEGER NOT NULL,
    CONSTRAINT "Factory_id_office_fkey" FOREIGN KEY ("id_office") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Factory" ("boost", "energy", "energy_per", "id", "id_office", "limit", "lvl", "xp") SELECT "boost", "energy", "energy_per", "id", "id_office", "limit", "lvl", "xp" FROM "Factory";
DROP TABLE "Factory";
ALTER TABLE "new_Factory" RENAME TO "Factory";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "xp" REAL NOT NULL DEFAULT 0,
    "gold" REAL NOT NULL DEFAULT 350,
    "energy" REAL NOT NULL DEFAULT 0,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("crdate", "energy", "gold", "id", "idvk", "lvl", "name", "update", "xp") SELECT "crdate", "energy", "gold", "id", "idvk", "lvl", "name", "update", "xp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
