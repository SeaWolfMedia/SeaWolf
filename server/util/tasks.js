const path = require('path');
const fs = require('fs').promises;
const CronJob = require('cron').CronJob;

const TASKS = {};

let test = {
    "scan-content-directory":{
        id: "scan-content-directory",
        name: "Scan Content Directory",
        description: "Scan the entire content directory and watch for changes to update the database.",
        jobs: {
            onInit: () => { },
            onStart: () => { },
            onRun: () => { },
            onComplete: () => { },
            onStop: () => { }
        }
    }
}

function defaultTaskInit(task) {
    console.log(`Initializing: ${task.name} [${task.id}]`);
}

function defaultTaskStart(task) {
    console.log(`Starting: ${task.name} [${task.id}]`);
}

function defaultTaskRun(task) {
    console.log(`Running: ${task.name} [${task.id}]`);
}

function defaultTaskComplete(task) {
    console.log(`Completing: ${task.name} [${task.id}]`);
}

function defaultTaskStop(task) {
    console.log(`Stopping: ${task.name} [${task.id}]`);
}

async function init() {
    console.log("Scanning tasks");
    let tasksDirectory = path.resolve(path.normalize("./"), "server", "tasks");
    let tasksToAdd = await fs.readdir(tasksDirectory);
    console.log("Adding tasks");
    for(let t = 0; t < tasksToAdd.length; t++){
        let task = require(path.resolve(tasksDirectory, tasksToAdd[t]));
        TASKS[task.id] = {
            id: task.id,
            name: task.name,
            description: task.description,
            jobs: {
                init: task.onInit || defaultTaskInit,
                start: task.onStart || defaultTaskStart,
                run: task.onRun || defaultTaskRun,
                complete: task.onComplete || defaultTaskComplete,
                stop: task.onStop || defaultTaskStop
            }
        }
        TASKS[task.id].jobs.init(TASKS[task.id]);
        // if(task.type == "cron"){
        //     TASKS.push({
        //         name: task.name,
        //         description: task.description,
        //         job: new CronJob({
        //             cronTime: task.cron.cronTime,
        //             onTick: task.cron.onTick,
        //             onComplete: task.cron.onComplete,
        //             start: task.cron.start,
        //             timeZone: task.cron.timeZone,
        //             runOnInit: task.cron.runOnInit
        //         })
        //     });
        // } else if(task.type == "manual"){
        //     TASKS.push({
        //         name: task.name,
        //         description: task.description,
        //         job: {
        //             onTick: task.manual.onTick,
        //             onComplete: task.manual.onComplete,
        //             runOnInit: task.manual.runOnInit
        //         }
        //     });
        //     if(task.manual.runOnInit){
        //         task.manual.onTick(task.manual.onComplete);
        //     }
        // }
    }
}

module.exports = {
    init
}