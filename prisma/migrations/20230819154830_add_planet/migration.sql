-- AlterTable
ALTER TABLE "Builder" ADD COLUMN "id_planet" INTEGER;

-- CreateTable
CREATE TABLE "System" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "planet" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Planet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "coal" REAL NOT NULL,
    "gas" REAL NOT NULL,
    "oil" REAL NOT NULL,
    "slate" REAL NOT NULL,
    "turf" REAL NOT NULL,
    "uranium" REAL NOT NULL,
    "iron" REAL NOT NULL,
    "golden" REAL NOT NULL,
    "crystal" INTEGER NOT NULL,
    "build" INTEGER NOT NULL DEFAULT 5,
    "artefact" INTEGER NOT NULL,
    "id_user" INTEGER,
    "id_system" INTEGER NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Planet_id_system_fkey" FOREIGN KEY ("id_system") REFERENCES "System" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
