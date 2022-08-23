const express = require("express");
const next = require('next');
const fs = require('fs').promises;
const { createWriteStream, createReadStream } = require("fs");
const readline = require('readline');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const tasks = require("./util/tasks.js");

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

global.rootDirectory = path.resolve(path.normalize("../"));
global.dataDirectory = path.resolve(rootDirectory, "data");
global.contentDirectory = path.resolve(rootDirectory, "content");

let CONFIG = {};

async function start() {
    console.clear();
    console.log("SeaWolf Server Booting");
    await scanData();
    await scanContent();
    await prepareNextjs();
    await hostWebsite();
    tasks.init();
    console.log("SeaWolf Server Available");
}

function scanData() {
    return new Promise(async (resolve, reject) => {
        console.log("Scanning Data...");
        var configFilePath = path.resolve(dataDirectory, "config.json");
        try {
            await fs.access(configFilePath);
            console.log("Config File Exists");
        } catch (configError) {
            try {
                console.log("! Config File Does Not Exist !");
                await fs.copyFile("config-default.json", configFilePath);
                console.log("Config File Created");
            } catch (defaultConfigError) {
                console.log("! Default Config File Does Not Exist !");
                reject("Configuration Error");
            }
        }
        try {
            var configFile = await fs.readFile(configFilePath);
            console.log("Config Is Being Parsed");
            CONFIG = JSON.parse(configFile);
        } catch (error) {
            reject(error);
        }
        console.log("Connecting To Database...");
        var databaseFilePath = path.resolve(dataDirectory, "seawolf.db");
        try {
            await fs.access(databaseFilePath);
            console.log("Database Exists");
        } catch (databaseError) {
            try {
                console.log("! Database Does Not Exist !");
                await fs.copyFile("prisma/seawolf-default.db", databaseFilePath);
                console.log("Database Created");
            } catch (defaultConfigError) {
                console.log("! Default Database Does Not Exist !");
                reject("Configuration Error");
            }
        }
        global.prisma = new PrismaClient({
            datasources: {
                db: {
                    url: "file:" + (path.resolve(dataDirectory, "seawolf.db")).replaceAll("\\", "/")
                }
            }
        });
        resolve();
    });
}

function scanContentFiles(directory, stream) {
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

function scanContent() {
    return new Promise(async (resolve, reject) => {
        console.log("Scanning Content...");
        await prisma.folder.upsert({
            where: {
                path: contentDirectory,
            },
            update: {},
            create: {
                name: "root",
                path: contentDirectory
            }
        });
        var upsertsFilePath = path.resolve(dataDirectory, "upserts.seawolf");
        var writableStream = createWriteStream(upsertsFilePath);
        await scanContentFiles(contentDirectory, writableStream);
        writableStream.end();
        var readableStream = createReadStream(upsertsFilePath)
        var upserts = [];
        const rl = readline.createInterface({
            input: readableStream,
            crlfDelay: Infinity
        });
        for await (var line of rl){
            var data = JSON.parse(line);
            if (data.type == "folder") {
                upserts.push(prisma.folder.upsert(data.data));
            } else {
                upserts.push(prisma.file.upsert(data.data));
            }
            if (upserts.length >= 10000) {
                await prisma.$transaction(upserts);
                upserts = [];
            }
        }
        readableStream.close();
        rl.close();
        await prisma.$transaction(upserts);
        await fs.unlink(upsertsFilePath);
        resolve();
    });
}

function prepareNextjs() {
    return new Promise(async (resolve, reject) => {
        console.log("Preparing Next.js...");
        await app.prepare();
        console.log("Next.js is ready!");
        resolve();
    });
}

function hostWebsite() {
    return new Promise(async (resolve, reject) => {
        const server = express();

        server.all("*", (req, res) => {
            return handle(req, res);
        });

        server.listen(52470, () => {
            console.log("SeaWolf Website Available");
            resolve();
        });
    });
}

start();