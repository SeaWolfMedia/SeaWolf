const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

function optimize(file) {
    return new Promise(async (resolve, reject) => {
        let measuredAudio = await measureAudioLoudness(file);
        await transcode({
            file: file,
            measuredAudioLoudness: measuredAudio
        });//file, measuredValues);
    });
}

function measureAudioLoudness(file) {
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

function transcode(transcodeOptions) {//file, measuredValues) {
    return new Promise((resolve, reject) => {
        if(transcodeOptions.file === undefined){
            reject("Must provide a file path");
        }
        // if(transcodeOptions.preset === undefined){
        //     reject("Must provide a preset");
        // }
        var transcodeCommand = ffmpeg(transcodeOptions.file).preset(transcodePreset)
        if (transcodeOptions.measuredAudioLoudness !== undefined) {
            transcodeCommand.audioFilters([
                {
                    filter: 'loudnorm',
                    options: {
                        I: -16,
                        TP: -1.5,
                        LRA: 11,
                        measured_I: transcodeOptions.measuredAudioLoudness.input_i,
                        measured_TP: transcodeOptions.measuredAudioLoudness.input_tp,
                        measured_LRA: transcodeOptions.measuredAudioLoudness.input_lra,
                        measured_thresh: transcodeOptions.measuredAudioLoudness.input_thresh,
                        offset: transcodeOptions.measuredAudioLoudness.target_offset,
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
            .save("D:\\Coding\\SeaWolf_Example_Data\\content\\tv\\moon knight\\Moon Knight - S01E05 - Asylum WEBDL-1080p-optimized.mp4")
    })
}

function transcodePreset(command) {
    command
        .videoCodec('libx264')
        .audioCodec('aac')
        .audioBitrate(256)
        .audioChannels(2)
        .addOption('-pix_fmt', 'yuv420p');
}

const resolution = [
    { name: '480p', dots: 852, lines: 480 },
    { name: '576p', dots: 768, lines: 576 },
    { name: '720p', dots: 1280, lines: 720 },
    { name: '1080p', dots: 1920, lines: 1080 },
    { name: '2160p', dots: 3840, lines: 2160 },
    { name: '4320p', dots: 7680, lines: 4320 },
];

function findResolution(dots, lines) {
    var i = 0;
    while (lines > resolution[i].lines) {
        i++;
    }
    while (dots > resolution[i].dots) {
        i++;
    }
    return resolution[i].name;
}

//console.log(findResolution(1920, 804));

//optimize("D:\\Coding\\SeaWolf_Example_Data\\content\\tv\\moon knight\\Moon Knight - S01E05 - Asylum WEBDL-1080p.mkv");

//ffmpeg - i in.mp4 - f ffmetadata in.txt

// ffmpeg.ffprobe("C:\\Users\\robbinip\\Desktop\\seawolf workspace\\content\\freeguy-fixedPixels.mp4", (err, metadata) => {
//     fs.writeFile("fixedPixels.json", JSON.stringify(metadata), () => {})
// })