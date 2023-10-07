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
    "stat" TEXT NOT NULL DEFAULT '[]'
);
INSERT INTO "new_Boss" ("artefact", "crystal", "description", "hp", "id", "id_post", "name") SELECT "artefact", "crystal", "description", "hp", "id", "id_post", "name" FROM "Boss";
DROP TABLE "Boss";
ALTER TABLE "new_Boss" RENAME TO "Boss";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
