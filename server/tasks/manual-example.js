module.exports = {
    /**
     * The name of the task
     */
    "name": "Example Manual Task",
    /**
     * The description of the task
     */
    "description": "An example manual task for SeaWolf.",
    /**
     * The type of task
     * @type cron, manual
     */
    "type": "manual",
    /**
     * Specify the cron job properties
     */
    "manual": {
        /**
         * Run the manual job as soon as it is created
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
         * Code to run when the manual job is stopped
         */
        "onComplete": () => {}
    }
}