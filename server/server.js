const express = require("express");
const next = require('next');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const chokidar = require('chokidar');
//global.db = require("@util/prismaManager.js");
const tasks = require("./util/tasks.js");

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

global.rootDirectory = path.resolve(path.normalize("../"));
global.contentDirectory = path.resolve(rootDirectory, "content");
global.dataDirectory = path.resolve(rootDirectory, "data");

async function start() {
    console.clear();
    console.log("SeaWolf Server Booting");
    await scanData();
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
            JSON.parse(configFile);
        } catch (error) {
            reject(error);
        }
        console.log("Connecting To Database...");
        var databaseFilePath = path.resolve(dataDirectory, "seawolf.db");
        try {
            await fs.access(databaseFilePath);
            console.log("Database Exists");
            resolve();
        } catch (databaseError) {
            console.error("Database doesnt exist. Creating...");
            exec("yarn prisma:migrate");
            const waitForDatabase = chokidar.watch(databaseFilePath).on('add', async (fullpath) => {
                if(fullpath == databaseFilePath){
                    console.log("added database");
                    waitForDatabase.close().then(() => {
                        resolve();
                    });
                }
            });
            //resolve();
            //reject("No Database");
        }
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