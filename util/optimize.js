const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

function optimize(file) {
    return new Promise(async (resolve, reject) => {
        var measuredValues = await measureLoudness(file);
        await transcode(file, measuredValues);
    });
}

function measureLoudness(file) {
    return new Promise((resolve, reject) => {
        ffmpeg(file)
            .audioFilters([
                {
                    filter: 'loudnorm',
                    options: {
                        I: -16,
                        TP: -1.5,
                        LRA: 11,
                        print_format: 'json'
                    }
                }
            ])
            .on("start", (command) => {
                console.log("Began Measuring File With Command: " + command);
            })
            .on("progress", (progress) => {
                console.log("Measuring File [" + (+progress.percent.toFixed(2)) + "%]");
            })
            .on("end", (stdout, stderr) => {
                console.log("File Has Been Measured");
                var json = JSON.parse(stderr.substring(stderr.indexOf('{'), stderr.indexOf('}') + 1));
                console.log(json);
                resolve(json);
            })
            .addOption('-f', 'null')
            .save('-')
    });
}

function transcode(file, measuredValues) {
    return new Promise((resolve, reject) => {
        var transcodeCommand = ffmpeg(file).preset(transcodePreset)
        if (measuredValues !== undefined) {
            transcodeCommand.audioFilters([
                {
                    filter: 'loudnorm',
                    options: {
                        I: -16,
                        TP: -1.5,
                        LRA: 11,
                        measured_I: measuredValues.input_i,
                        measured_TP: measuredValues.input_tp,
                        measured_LRA: measuredValues.input_lra,
                        measured_thresh: measuredValues.input_thresh,
                        offset: measuredValues.target_offset,
                        linear: true
                    }
                }
            ]);
        }
        transcodeCommand
            .on("start", (command) => {
                console.log("Began Optimizing File With Command: " + command);
            })
            .on("progress", (progress) => {
                console.log("Optimizing File [" + (+progress.percent.toFixed(2)) + "%]");
            })
            .on("end", () => {
                console.log("File Is Now Optimized");
                resolve();
            })
            .save("optimized/outputfile-loudnorm.mp4")
    })
}

function transcodePreset(command) {
    command
        .videoCodec('libx264')
        .audioCodec('aac')
        .audioBitrate(256)
        .audioChannels(2)
}