module.exports = {
    "name": "Scan Content Directory",
    "description": "Scans the entire content directory for changes and updates the database.",
    "type": "cron",
    "cron": {
        "cronTime": "* * * * * *",
        "onTick": (onComplete) => { 

        },
        "onComplete": () => { 
            
        },
        "start": true,
        "timeZone": "America/Indiana/Indianapolis",
        "runOnInit": true
    }
}