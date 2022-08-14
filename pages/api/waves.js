const fs = require('fs').promises;
const { createReadStream } = require("fs");

export default async function waves(req, res) {
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
    }
    const waveId = parseInt(req.query.id);
    if (!waveId){
        res.status(400).send("Requires Wave ID");
    }
    const waveData = await global.prisma.file.findUnique({
        where: {
            id: waveId
        }
    })
    if (!waveData){
        res.status(400).send("Invalid Wave ID");
    }
    const waveFilePath = waveData.path;
    const waveFileSize = (await fs.stat(waveFilePath)).size;
    const CHUNK_SIZE = 10 ** 6; //1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, waveFileSize - 1);
    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${waveFileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };
    res.writeHead(206, headers);
    const videoStream = createReadStream(waveFilePath, { start, end });
    videoStream.pipe(res);
}