-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "xp" REAL NOT NULL DEFAULT 0,
    "gold" REAL NOT NULL DEFAULT 5000,
    "iron" REAL NOT NULL DEFAULT 500,
    "crystal" INTEGER NOT NULL DEFAULT 0,
    "energy" REAL NOT NULL DEFAULT 1000,
    "research" REAL NOT NULL DEFAULT 0,
    "reputation" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'player',
    "limiter" INTEGER NOT NULL DEFAULT 0,
    "id_corporation" INTEGER NOT NULL DEFAULT 0,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("crdate", "crystal", "energy", "gold", "id", "id_corporation", "idvk", "iron", "limiter", "lvl", "name", "reputation", "research", "status", "update", "xp") SELECT "crdate", "crystal", "energy", "gold", "id", "id_corporation", "idvk", "iron", "limiter", "lvl", "name", "reputation", "research", "status", "update", "xp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
