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
    "status" TEXT NOT NULL DEFAULT 'player',
    "id_corportation" INTEGER NOT NULL DEFAULT 0,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("crdate", "energy", "gold", "id", "id_corportation", "idvk", "lvl", "name", "reputation", "update", "xp") SELECT "crdate", "energy", "gold", "id", "id_corportation", "idvk", "lvl", "name", "reputation", "update", "xp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
