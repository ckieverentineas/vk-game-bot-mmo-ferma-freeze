-- CreateTable
CREATE TABLE "Research" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Research_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Planet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "coal" REAL NOT NULL,
    "gas" REAL NOT NULL,
    "oil" REAL NOT NULL,
    "slate" REAL NOT NULL,
    "turf" REAL NOT NULL,
    "uranium" REAL NOT NULL,
    "iron" REAL NOT NULL,
    "golden" REAL NOT NULL,
    "crystal" REAL NOT NULL,
    "build" INTEGER NOT NULL DEFAULT 7,
    "artefact" REAL NOT NULL,
    "id_user" INTEGER,
    "id_system" INTEGER NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Planet_id_system_fkey" FOREIGN KEY ("id_system") REFERENCES "System" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Planet" ("artefact", "build", "coal", "crdate", "crystal", "gas", "golden", "id", "id_system", "id_user", "iron", "name", "oil", "slate", "turf", "update", "uranium") SELECT "artefact", "build", "coal", "crdate", "crystal", "gas", "golden", "id", "id_system", "id_user", "iron", "name", "oil", "slate", "turf", "update", "uranium" FROM "Planet";
DROP TABLE "Planet";
ALTER TABLE "new_Planet" RENAME TO "Planet";
CREATE TABLE "new_Builder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL DEFAULT 'energy',
    "income" REAL NOT NULL DEFAULT 1,
    "cost" REAL NOT NULL DEFAULT 100,
    "worker" INTEGER NOT NULL DEFAULT 1,
    "costing" TEXT NOT NULL DEFAULT 'empty',
    "input" TEXT NOT NULL DEFAULT 'empty',
    "output" TEXT NOT NULL DEFAULT 'empty',
    "require" TEXT NOT NULL DEFAULT 'empty',
    "id_user" INTEGER NOT NULL,
    "id_planet" INTEGER,
    "upgradeble" BOOLEAN NOT NULL DEFAULT true,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Builder_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Builder" ("cost", "costing", "crdate", "id", "id_planet", "id_user", "income", "input", "lvl", "name", "output", "require", "type", "update", "worker") SELECT "cost", "costing", "crdate", "id", "id_planet", "id_user", "income", "input", "lvl", "name", "output", "require", "type", "update", "worker" FROM "Builder";
DROP TABLE "Builder";
ALTER TABLE "new_Builder" RENAME TO "Builder";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
