-- CreateTable
CREATE TABLE "Folder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "created" DATETIME NOT NULL,
    "updated" DATETIME NOT NULL,
    "parentFolderPath" TEXT,
    CONSTRAINT "Folder_parentFolderPath_fkey" FOREIGN KEY ("parentFolderPath") REFERENCES "Folder" ("path") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "File" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "created" DATETIME NOT NULL,
    "updated" DATETIME NOT NULL,
    "folderPath" TEXT,
    CONSTRAINT "File_folderPath_fkey" FOREIGN KEY ("folderPath") REFERENCES "Folder" ("path") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Folder_path_key" ON "Folder"("path");

-- CreateIndex
CREATE UNIQUE INDEX "File_path_key" ON "File"("path");
