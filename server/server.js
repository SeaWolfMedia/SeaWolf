const express = require("express");
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

async function start(){
    console.clear();
    console.log("SeaWolf Server Booting");
    await prepareNextjs();
    await hostWebsite();
    console.log("SeaWolf Server Available");
}

function prepareNextjs() {
    return new Promise(async (resolve, reject) => {
        console.log("Preparing Next.js...");
        await app.prepare();
        console.log("Next.js is ready!");
        resolve();
    });
}

function hostWebsite(){
    return new Promise(async (resolve, reject) => {
        const server = express();

        server.use((req, res, next) => {
            res.set("Service-Worker-Allowed", "/");
            next();
        });

        server.use(express.static("@seawolf/public", {
            setHeaders: function (res) {
                res.set("Service-Worker-Allowed", "/");
            }
        }));

        server.use("/api", (req, res) => {
            res.send("successful api response");
        });

        server.all("*", (req, res) => {
            return handle(req, res)
        })

        server.listen(52470, () => {
            console.log("SeaWolf Website Available");
            resolve();
        })
    });
}

start();