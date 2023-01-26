const path = require('path');
const fs = require('fs').promises;
const chokidar = require('chokidar');
const CronJob = require('cron').CronJob;
const INotifyWait = require('inotifywait');
var os = require('os');

let running = false;
let startTime;
let watcher;

async function onInit(manager, task){
    manager.start(task);
}

async function onStart(manager, task){
    return new Promise((resolve, reject) => {
        if(os.platform() == "linux"){
            watcher = new INotifyWait(contentDirectory, {
                recursive: true,
                watchDirectory: true,
                events: ["modify", "attrib", "create", "delete", "moved_to", "close_write"]
            });
            console.log("chose inotifywait");
        } else {
            watcher = chokidar.watch(contentDirectory, {
                ignoreInitial: true
            });
            console.log("chose chokidar");
        }
        watcher.on('ready', (process) => {
            console.log('watcher is watching');
            manager.run(task);
            resolve();
        });
        watcher.on('add', (filename, stats) => {
            console.log(filename + ' added');
        });
        watcher.on('addDir', (name, stats) => {
            console.log(name + ' added');
        })
        watcher.on('change', (filename, stats) => {
            console.log(filename + ' changed');
        });
        watcher.on('unlink', (filename, stats) => {
            console.log(filename + ' unlinked');
        });
        watcher.on('unlinkDir', (name, stats) => {
            console.log(name + ' unlinked');
        })
        // watcher.on('unknown', function (filename, event, stats) {
        //     console.log(filename + ' unknown');
        //     console.log(event);
        // });
        watcher.on('close', () => {
            console.log('closed');
            reject();
        });
        watcher.on('error', (error) => {
            console.log(error);
            reject();
        });
    });
}


//return all folders in the directory after updating the directory files and folders
async function directoryUpdates(directory) {
    let directoryContent = await fs.readdir(directory, { withFileTypes: true });
    let directoryFiles = directoryContent.filter(dirent => dirent.isFile()).map(dirent => path.resolve(directory, dirent.name));
    let directoryFolders = directoryContent.filter(dirent => dirent.isDirectory()).map(dirent => path.resolve(directory, dirent.name));
    let directoryStats = await fs.stat(directory);
    let databaseContentQuery = (await db.query("folder", "findUnique", {
        where: {
            path: directory
        },
        select: {
            folders: {
                select: {
                    path: true
                }
            },
            files: {
                select: {
                    path: true
                }
            }
        }
    })).query;
    let databaseContent = await db.execute(databaseContentQuery);
    let databaseFiles = (databaseContent.files !== undefined) ? databaseContent.files.map(dbObject => dbObject.path) : [];
    let databaseFolders = (databaseContent.folders !== undefined) ? databaseContent.folders.map(dbObject => dbObject.path) : [];
    let newFiles = directoryFiles.filter(filepath => !databaseFiles.includes(filepath));
    let oldFiles = databaseFiles.filter(filepath => !directoryFiles.includes(filepath));
    let newFolders = directoryFolders.filter(folderpath => !databaseFolders.includes(folderpath));
    let oldFolders = databaseFolders.filter(folderpath => !directoryFolders.includes(folderpath));

    //console.log(directoryFolders, databaseFolders);
    //console.log(newFolders, oldFolders);

    await db.transaction(async (tx) => {
        for (let folder of oldFolders) {
            await tx.folder.delete({
                where: {
                    path: folder
                }
            });
        }
        for(let folder of newFolders){
            let { birthtime, mtime } = await fs.stat(folder);
            await tx.folder.create({
                data: {
                    name: path.basename(folder),
                    path: folder,
                    created: birthtime,
                    updated: mtime,
                    parentFolderPath: directory
                }
            });
        }
        for (let file of oldFiles) {
            await tx.file.delete({
                where: {
                    path: file
                }
            });
        }
        for (let file of newFiles) {
            let { birthtime, mtime } = await fs.stat(file);
            await tx.file.create({
                data: {
                    name: path.parse(file).base,
                    path: file,
                    created: birthtime,
                    updated: mtime,
                    folderPath: directory
                }
            });
        }
    });

    for (let folder of directoryFolders) {
        let folderDirectoriesSize = (await fs.readdir(folder, { withFileTypes: true })).filter(dirent => dirent.isDirectory()).length;
        let databaseFolderLastUpdateQuery = (await db.query("folder", "findUnique", {
            where: {
                path: folder
            },
            select: {
                updated: true
            }
        })).query;
        let databaseFolderLastUpdate = (await db.execute(databaseFolderLastUpdateQuery)).updated;
        let { mtime } = await fs.stat(folder);
        //console.log(folderDirectoriesSize, databaseFolderLastUpdate.getTime(), mtime.getTime());
        if ((folderDirectoriesSize > 0 || databaseFolderLastUpdate.getTime() !== mtime.getTime()) || newFolders.length > 0){
            console.log(`updating ${folder}`);
            await directoryUpdates(folder);
            let updateFolderLastUpdateQuery = (await db.query("folder", "update", {
                where: {
                    path: folder
                },
                data: {
                    updated: mtime
                }
            })).query;
            await db.execute(updateFolderLastUpdateQuery);
        }
    }
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

async function onTick(onComplete) {
    console.time("scan");

    watcher = new INotifyWait(contentDirectory, { recursive: true });
    watcher.on('ready', function (process) {
        console.log('watcher is watching');
    });
    watcher.on('add', function (filename, stats) {
        console.log(filename + ' added');
    });
    watcher.on('change', function (filename, stats) {
        console.log(filename + ' changed');
    });
    watcher.on('unlink', function (filename, stats) {
        console.log(filename + ' unlinked');
    });
    watcher.on('unknown', function (filename, event, stats) {
        console.log(filename + ' unknown');
        console.log(event);
    });
    watcher.on('close', function () {
        console.log('closed');
    });
    watcher.on('error', function (error) {
        console.log(error);
    });

    let {birthtime, mtime} = await fs.stat(contentDirectory);
    let rootQuery = (await db.query("folder", "upsert", {
        where: {
            path: contentDirectory
        },
        update: {},
        create: {
            name: "content",
            path: contentDirectory,
            created: birthtime,
            updated: mtime
        }
    })).query;
    await db.execute(rootQuery);
    console.timeEnd("scan");
    //await directoryUpdates(contentDirectory);
    return;
    // await db.transaction(async (tx) => {

    // });
    //let test = await fs.stat(contentDirectory);
    //console.log(test);
    watcher = chokidar.watch(global.contentDirectory).on('all', async (event, fullpath) => {
        const directory = path.dirname(fullpath);
        const name = path.parse(fullpath).base;
        let query;
        switch(event){
            case "add":
                query = (await db.query("file", "upsert", {
                    where: {
                        path: fullpath
                    },
                    update: {},
                    create: {
                        name: name,
                        path: fullpath,
                        folderPath: directory
                    }
                })).query;
                db.execute(query);
                break;
            case "addDir":
                query = (await db.query("folder", "upsert", {
                    where: {
                        path: fullpath
                    },
                    update: {},
                    create: {
                        name: name,
                        path: fullpath,
                        parentFolderPath: directory
                    }
                })).query;
                db.execute(query);
                break;
            default:
                console.log("untracked change", event, path);
                break;
        }
        //console.log(event, path);
        //console.log(watcher.getWatched());
    });
    onComplete();
}

const scanContentFiles = (directory, stream) => {
    return new Promise(async (resolve, reject) => {
        var contents = await fs.readdir(directory);
        for (var content of contents) {
            var contentPath = path.join(directory, content);
            var stats = await fs.stat(contentPath);
            if (stats.isDirectory()) {
                stream.write(JSON.stringify({
                    type: "folder",
                    data: {
                        where: {
                            path: contentPath,
                        },
                        update: {},
                        create: {
                            name: content,
                            path: contentPath,
                            parentFolderPath: directory
                        }
                    }
                }) + "\n");
                await scanContentFiles(contentPath, stream);
            } else {
                stream.write(JSON.stringify({
                    type: "file",
                    data: {
                        where: {
                            path: contentPath
                        },
                        update: {},
                        create: {
                            name: content,
                            path: contentPath,
                            folderPath: directory
                        }
                    }
                }) + "\n");
            }
        }
        resolve();
    });
}

module.exports = {
    id: "scan-content-directory",
    name: "Scan Content Directory",
    description: "Scans the entire content directory for changes and updates the database.",
    onInit: onInit,
    onStart: onStart
}

// module.exports = {
//     "id": "scan-content-directory",
//     "name": "Scan Content Directory",
//     "description": "Scans the entire content directory for changes and updates the database.",
//     "type": "manual",
//     "manual": {
//         "runOnInit": true,
//         "onTick": onTick,
//         // "onTick": async (onComplete) => { 
//         //     if(running == false){
//         //         running = true;
//         //         startTime = DateTime.now();
//         //         console.log("Scanning Content...");
//         //         await prisma.folder.upsert({
//         //             where: {
//         //                 path: contentDirectory,
//         //             },
//         //             update: {},
//         //             create: {
//         //                 name: "root",
//         //                 path: contentDirectory
//         //             }
//         //         });
//         //         var upsertsFilePath = path.resolve(dataDirectory, "upserts.seawolf");
//         //         var writableStream = createWriteStream(upsertsFilePath);
//         //         await scanContentFiles(contentDirectory, writableStream);
//         //         writableStream.end();
//         //         var readableStream = createReadStream(upsertsFilePath)
//         //         var upserts = [];
//         //         const rl = readline.createInterface({
//         //             input: readableStream,
//         //             crlfDelay: Infinity
//         //         });
//         //         for await (var line of rl) {
//         //             var data = JSON.parse(line);
//         //             if (data.type == "folder") {
//         //                 upserts.push(prisma.folder.upsert(data.data));
//         //             } else {
//         //                 upserts.push(prisma.file.upsert(data.data));
//         //             }
//         //             if (upserts.length >= 100000) {
//         //                 await prisma.$transaction(upserts);
//         //                 upserts = [];
//         //             }
//         //         }
//         //         readableStream.close();
//         //         rl.close();
//         //         await prisma.$transaction(upserts);
//         //         await fs.unlink(upsertsFilePath);
//         //         onComplete();
//         //     }
//         // },
//         "onComplete": () => { 
//             //running = false;
//             //console.log("Scanned content (" + DateTime.now().minus(startTime.toObject()).toFormat("HH'h 'mm'm 'ss's'") + ")");
//             console.log("complete");
//         }
//     }
// }