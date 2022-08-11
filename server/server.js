const express = require("express");
const next = require('next');
const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const rootDirectory = path.resolve(path.normalize("../"));
const dataDirectory = path.resolve(rootDirectory, "data");
const contentDirectory = path.resolve(rootDirectory, "content");

let CONFIG = {};

async function start() {
    console.clear();
    console.log("SeaWolf Server Booting");
    await scanData();
    await scanContent();
    await prepareNextjs();
    await hostWebsite();
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

function scanContentFiles(directory, id) {
    return new Promise(async (resolve, reject) => {
        var content = await fs.readdir(directory);
        for (var c of content) {
            var joined = path.join(directory, c);
            var stats = await fs.stat(joined);
            if (stats.isDirectory()) {
                var folder = await global.prisma.folder.findUnique({
                    where: {
                        path: joined,
                    }
                });
                if (folder == null) {
                    folder = await global.prisma.folder.create({
                        data: {
                            name: c,
                            path: joined,
                            parentFolderId: id
                        }
                    });
                }
                await scanContentFiles(joined, folder.id);
            } else {
                var file = await global.prisma.file.findUnique({
                    where: {
                        path: joined,
                    }
                });
                if (file == null) {
                    await global.prisma.file.create({
                        data: {
                            name: c,
                            path: joined,
                            folderId: id
                        }
                    })
                }
            }
        }
        resolve();
    });
}

function scanContent() {
    return new Promise(async (resolve, reject) => {
        console.log("Scanning Content...");
        var directory = await global.prisma.folder.findUnique({
            where: {
                path: contentDirectory,
            }
        });
        if (directory == null) {
            directory = await global.prisma.folder.create({
                data: {
                    name: "root",
                    path: contentDirectory
                }
            });
        }
        await scanContentFiles(contentDirectory, directory.id);
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

        // server.use((req, res, n) => {
        //     res.set("Service-Worker-Allowed", "/");
        //     if(req.url !== "/setup" && CONFIG.setup === false){
        //         res.redirect("/setup");
        //     }
        //     n();
        // });

        // server.use(express.static("@seawolf/public", {
        //     setHeaders: function (res) {
        //         res.set("Service-Worker-Allowed", "/");
        //     }
        // }));

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