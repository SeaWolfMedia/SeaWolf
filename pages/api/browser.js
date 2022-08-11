export default async function handler(req, res) {
    const directory = await global.prisma.folder.findUnique({
        where: {
            id: parseInt(req.query.directory)
        }
    })
    const files = await global.prisma.folder.findUnique({
        where: {
            id: parseInt(req.query.directory)
        }
    }).files();
    const folders = await global.prisma.folder.findUnique({
        where: {
            id: parseInt(req.query.directory)
        }
    }).folders();
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