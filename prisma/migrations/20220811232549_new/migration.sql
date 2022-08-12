-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_File" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "updatesPerformed" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "folderId" TEXT,
    CONSTRAINT "File_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("path") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_File" ("createdAt", "folderId", "id", "name", "path", "updatedAt", "updatesPerformed") SELECT "createdAt", "folderId", "id", "name", "path", "updatedAt", "updatesPerformed" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
CREATE UNIQUE INDEX "File_path_key" ON "File"("path");
CREATE TABLE "new_Folder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "updatesPerformed" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "parentFolderId" TEXT,
    CONSTRAINT "Folder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "Folder" ("path") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Folder" ("createdAt", "id", "name", "parentFolderId", "path", "updatedAt", "updatesPerformed") SELECT "createdAt", "id", "name", "parentFolderId", "path", "updatedAt", "updatesPerformed" FROM "Folder";
DROP TABLE "Folder";
ALTER TABLE "new_Folder" RENAME TO "Folder";
CREATE UNIQUE INDEX "Folder_path_key" ON "Folder"("path");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
