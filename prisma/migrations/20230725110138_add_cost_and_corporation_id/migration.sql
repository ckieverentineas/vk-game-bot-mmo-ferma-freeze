-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "xp" REAL NOT NULL DEFAULT 0,
    "gold" REAL NOT NULL DEFAULT 350,
    "energy" REAL NOT NULL DEFAULT 0,
    "reputation" REAL NOT NULL DEFAULT 0,
    "id_corportation" INTEGER NOT NULL DEFAULT 0,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("crdate", "energy", "gold", "id", "idvk", "lvl", "name", "reputation", "update", "xp") SELECT "crdate", "energy", "gold", "id", "idvk", "lvl", "name", "reputation", "update", "xp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE TABLE "new_Builder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "xp" REAL NOT NULL DEFAULT 0,
    "income" REAL NOT NULL DEFAULT 1,
    "cost" REAL NOT NULL DEFAULT 100,
    "worker" INTEGER NOT NULL DEFAULT 1,
    "count" INTEGER NOT NULL DEFAULT 1,
    "id_user" INTEGER NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Builder_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Builder" ("count", "crdate", "id", "id_user", "income", "lvl", "name", "update", "worker", "xp") SELECT "count", "crdate", "id", "id_user", "income", "lvl", "name", "update", "worker", "xp" FROM "Builder";
DROP TABLE "Builder";
ALTER TABLE "new_Builder" RENAME TO "Builder";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
