-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Boss" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_post" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hp" REAL NOT NULL,
    "artefact" REAL NOT NULL,
    "crystal" REAL NOT NULL,
    "stat" TEXT NOT NULL DEFAULT '[]',
    "defeat" BOOLEAN NOT NULL DEFAULT false,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Boss" ("artefact", "crystal", "defeat", "description", "hp", "id", "id_post", "name", "stat") SELECT "artefact", "crystal", "defeat", "description", "hp", "id", "id_post", "name", "stat" FROM "Boss";
DROP TABLE "Boss";
ALTER TABLE "new_Boss" RENAME TO "Boss";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
