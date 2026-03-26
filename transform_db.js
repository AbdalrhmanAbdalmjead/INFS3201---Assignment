// one-time database transformation for Assignment 4
// step 1 only: add empty employees array into each shift

const { setServers } = require("node:dns/promises")
setServers(["1.1.1.1", "8.8.8.8"])

require("dotenv").config()
const { MongoClient } = require("mongodb")

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.DB_NAME || "infs3201_winter2026"

/**
 * connect to MongoDB and return the database object
 * @returns {Promise<any>}
 */
async function getDb() {
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    return { db: client.db(DB_NAME), client: client }
}

/**
 * add an empty employees array to every shift
 * @returns {Promise<void>}
 */
async function addEmptyEmployeesArray() {
    const conn = await getDb()
    const db = conn.db
    const client = conn.client

    await db.collection("shifts").updateMany(
        {},
        { $set: { employees: [] } }
    )

    console.log("Step 1 done: empty employees array added to all shifts.")

    await client.close()
}

/**
 * run step 1 only
 * @returns {Promise<void>}
 */
async function main() {
    await addEmptyEmployeesArray()
}

main()