export default async function browser(req, res) {
    const directoryId = parseInt(req.query.directory);
    const q = (await db.query("folder", "findUnique", {
        where: {
            id: directoryId
        },
        select: {
            files: true,
            folders: true
        }
    })).query;
    const directory = await db.execute(q);
    const files = directory.files;
    const folders = directory.folders;
    directory.originalId = directory.id;
    directory.id = directory.path;
    directory.isDir = true;
    files.forEach((file) => {
        file.originalId = file.id;
        file.id = file.path;
    });
    folders.forEach((folder) => {
        folder.originalId = folder.id;
        folder.id = folder.path;
        folder.isDir = true;
    });
    res.json({
        directory: directory,
        content: files.concat(folders)
    });
}