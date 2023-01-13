const path = require('path');
const fs = require('fs').promises;
const { createWriteStream, createReadStream } = require("fs");
const readline = require('readline');
const { DateTime } = require("luxon");
const chokidar = require('chokidar');

let running = false;
let startTime;

let watcher;

async function onTick(onComplete) {
    let rootQuery = (await db.query("folder", "upsert", {
        where: {
            path: contentDirectory
        },
        update: {},
        create: {
            name: "content",
            path: contentDirectory
        }
    })).query;
    await db.execute(rootQuery);
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
    "name": "Scan Content Directory",
    "description": "Scans the entire content directory for changes and updates the database.",
    "type": "manual",
    "manual": {
        "runOnInit": true,
        "onTick": onTick,
        // "onTick": async (onComplete) => { 
        //     if(running == false){
        //         running = true;
        //         startTime = DateTime.now();
        //         console.log("Scanning Content...");
        //         await prisma.folder.upsert({
        //             where: {
        //                 path: contentDirectory,
        //             },
        //             update: {},
        //             create: {
        //                 name: "root",
        //                 path: contentDirectory
        //             }
        //         });
        //         var upsertsFilePath = path.resolve(dataDirectory, "upserts.seawolf");
        //         var writableStream = createWriteStream(upsertsFilePath);
        //         await scanContentFiles(contentDirectory, writableStream);
        //         writableStream.end();
        //         var readableStream = createReadStream(upsertsFilePath)
        //         var upserts = [];
        //         const rl = readline.createInterface({
        //             input: readableStream,
        //             crlfDelay: Infinity
        //         });
        //         for await (var line of rl) {
        //             var data = JSON.parse(line);
        //             if (data.type == "folder") {
        //                 upserts.push(prisma.folder.upsert(data.data));
        //             } else {
        //                 upserts.push(prisma.file.upsert(data.data));
        //             }
        //             if (upserts.length >= 100000) {
        //                 await prisma.$transaction(upserts);
        //                 upserts = [];
        //             }
        //         }
        //         readableStream.close();
        //         rl.close();
        //         await prisma.$transaction(upserts);
        //         await fs.unlink(upsertsFilePath);
        //         onComplete();
        //     }
        // },
        "onComplete": () => { 
            //running = false;
            //console.log("Scanned content (" + DateTime.now().minus(startTime.toObject()).toFormat("HH'h 'mm'm 'ss's'") + ")");
            console.log("complete");
        }
    }
}