const path = require('path');
const fs = require('fs').promises;

const TASKS = {};

const manager = {
    init: initTask,
    start: startTask,
    run: runTask,
    stop: stopTask
};

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
                init: task.onInit,
                start: task.onStart,
                run: task.onRun,
                complete: task.onComplete,
                stop: task.onStop
            },
            status:{
                init: "ready",
                start: "ready",
                run: "ready",
                complete: "ready",
                stop: "ready"
            }
        }
        initTask(TASKS[task.id]);
    }
}

function defaultTaskInit(manager, task) {
    console.log(`Initializing: ${task.name} [${task.id}]`);
}

function defaultTaskStart(manager, task) {
    console.log(`Starting: ${task.name} [${task.id}]`);
}

function defaultTaskRun(manager, task) {
    console.log(`Running: ${task.name} [${task.id}]`);
}

function defaultTaskComplete(manager, task) {
    console.log(`Completing: ${task.name} [${task.id}]`);
}

function defaultTaskStop(manager, task) {
    console.log(`Stopping: ${task.name} [${task.id}]`);
}

async function initTask(task){
    if(task.status.init == "ready"){
        task.status.init = "running";
        defaultTaskInit(manager, task);
        if(task.jobs.init){
            await task.jobs.init(manager, task);
        }
        task.status.init = "complete";
    }
}

async function startTask(task){
    if(task.status.start == "ready"){
        task.status.start = "running";
        defaultTaskStart(manager, task);
        if(task.jobs.start){
            await task.jobs.start(manager, task);
        }
        task.status.start = "complete";
    }
}

async function runTask(task){
    if(task.status.run == "ready"){
        task.status.run = "running";
        defaultTaskRun(manager, task);
        if(task.jobs.run){
            await task.jobs.run(manager, task);
        }
        task.status.run = "complete";
        task.status.complete = "running";
        defaultTaskComplete(manager, task);
        if(task.jobs.complete){
            await task.jobs.complete(manager, task);
        }
        task.status.complete = "ready";
        task.status.run = "ready";
    }
}

async function stopTask(task){

}

module.exports = {
    init
}