const { Prisma, PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const queue = [];
const maxRetries = 5;
let ready = true;
let retries = 0;

async function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    });
}

async function nextQueueItem() {
    if (ready) {
        ready = false;
        let queueItem = queue.shift();
        let itemData;
        while (retries < maxRetries) {
            try {
                if (queueItem.item) {
                    itemData = await queueItem.item;
                } else if (queueItem.query) {
                    itemData = prisma[queueItem.database][queueItem.query](queueItem.data);
                } else if (queueItem.transaction) {
                    itemData = await prisma.$transaction(queueItem.transaction);
                }
                break;
            } catch (e) {
                console.log("couldn't complete, retrying...");
                console.error(e);
                await wait(1000);
                retries++;
            }
        }
        if (retries == maxRetries) {
            console.log("couldn't complete, out of retries");
        }
        queueItem.callback(itemData);
        retries = 0;
        ready = true;
        if (queue.length > 0) {
            nextQueueItem();
        }
    }
}

function addToExecuteQueue(item, callback) {
    queue.push({
        item: item,
        callback: callback
    });
    nextQueueItem();
}

function addToQueryQueue(database, query, data, callback) {
    queue.push({
        database: database,
        query: query,
        data: data,
        callback: callback
    });
    nextQueueItem();
}

function addToTransactionQueue(transaction, callback) {
    queue.push({
        transaction: transaction,
        callback: callback
    });
    nextQueueItem();
}

async function execute(query) {
    return new Promise(async (resolve, reject) => {
        addToExecuteQueue(query, (result) => {
            if (result instanceof Prisma.PrismaClientKnownRequestError) {
                console.log("failed failure");
                reject(result);
            }
            resolve(result);
        });
    });
}

async function query(database, query, data) {
    return new Promise(async (resolve, reject) => {
        addToQueryQueue(database, query, data, (result) => {
            if (result instanceof Prisma.PrismaClientKnownRequestError) {
                console.log("failed failure");
                reject(result);
            }
            resolve({
                query: result
            });
        });
    });
}

async function transaction(transaction) {
    return new Promise(async (resolve, reject) => {
        addToTransactionQueue(transaction, (result) => {
            if (result instanceof Prisma.PrismaClientKnownRequestError) {
                console.log("failed failure");
                reject(result);
            }
            resolve({
                transaction: result
            });
        });
    });
}


module.exports = {
    execute, query, transaction
}