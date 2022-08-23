const path = require('path');
const fs = require('fs').promises;
const CronJob = require('cron').CronJob;

const TASKS = [];

exports.init = async () => {
    var tasksDirectory = path.resolve(path.normalize("./"), "server", "tasks");
    var tasksToAdd = await fs.readdir(tasksDirectory);
    for(var t = 0; t < tasksToAdd.length; t++){
        var task = require(path.resolve(tasksDirectory, tasksToAdd[t]));
        if(task.type == "cron"){
            TASKS.push({
                name: task.name,
                description: task.description,
                job: new CronJob({
                    cronTime: task.cron.cronTime,
                    onTick: task.cron.onTick,
                    onComplete: task.cron.onComplete,
                    start: task.cron.start,
                    timeZone: task.cron.timeZone,
                    runOnInit: task.cron.runOnInit
                })
            });
        } else if(task.type == "manual"){
            TASKS.push({
                name: task.name,
                description: task.description,
                job: {}
            })
        }
        
    }
}