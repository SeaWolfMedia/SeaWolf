const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const { createReadStream, createWriteStream } = require("fs");

export default async function waves(req, res) {
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
    }
    const waveId = parseInt(req.query.id);
    if (!waveId){
        res.status(400).send("Requires Wave ID");
    }
    const query = (await db.query("file", "findUnique", {
        where: {
            id: waveId
        }
    })).query;
    const waveData = await db.execute(query);
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
    const videoStream = createReadStream(waveFilePath, { start: start, end: end });
    // ffmpeg(videoStream)
    //     .inputFormat('mp4')
    //     .outputFormat('mp4')
    //     .videoCodec('libx264')
    //     .audioCodec('aac')
    //     .addOption('-pix_fmt', 'yuv420p')
    //     .outputOptions([
    //         '-movflags frag_keyframe+empty_moov'
    //     ])
    //     .save("-");
    videoStream.pipe(res);
}