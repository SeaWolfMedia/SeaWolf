module.exports = {
    /**
     * The name of the task
     */
    "name": "Example Cron Task",
    /**
     * The description of the task
     */
    "description": "An example cron task for SeaWolf.",
    /**
     * The type of task
     * @type cron, manual
     */
    "type": "cron",
    /**
     * Specify the cron job properties
     */
    "cron": {
        /**
         * When to run the cron job
         */
        "cronTime": "* * * * * *",
        /**
         * Start the cron job as soon as it is created
         * @boolean
         */
        "start": false,
        /**
         * The timezone the cron job will be based off of
         */
        "timeZone": "America/Indiana/Indianapolis",
        /**
         * Run the cron job as soon as it is created
         * 
         * Does not start the job
         * 
         * @boolean
         */
        "runOnInit": false,
        /**
         * Code to run at the specified time
         * 
         * Can call onComplete() in the function if needed
         * 
         * @param {Function} onComplete
         */
        "onTick": (onComplete) => {},
        /**
         * Code to run when the cron job is stopped or after the specified time
         */
        "onComplete": () => {}
    }
}