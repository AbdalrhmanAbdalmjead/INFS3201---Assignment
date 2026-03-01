const { setServers } = require("node:dns/promises")
setServers(["1.1.1.1", "8.8.8.8"])

require("dotenv").config()
const { MongoClient } = require("mongodb")
const fs = require("fs/promises")

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.DB_NAME || "infs3201_winter2026"

/**
 * This function reads a JSON file and converts it to a JavaScript array.
 * It is used to load data from employees.json, shifts.json, and assignments.json.
 * @param {string} filename - name of the JSON file
 * @returns {Promise<any[]>}
 */
async function readJson(filename) {
    const text = await fs.readFile(filename, "utf8")
    return JSON.parse(text)
}

/**
 * This function connects to MongoDB and imports all JSON data
 * into the correct MongoDB collections.
 * It deletes old data first, then inserts new data.
 * @returns {Promise<void>}
 */
async function main() {
    const client = new MongoClient(MONGODB_URI)
    await client.connect()

    const db = client.db(DB_NAME)

    const employees = await readJson("employees.json")
    const shifts = await readJson("shifts.json")
    const assignments = await readJson("assignments.json")

    await db.collection("employees").deleteMany({})
    await db.collection("shifts").deleteMany({})
    await db.collection("assignments").deleteMany({})

    if (employees.length > 0) {
        await db.collection("employees").insertMany(employees)
    }

    if (shifts.length > 0) {
        await db.collection("shifts").insertMany(shifts)
    }

    if (assignments.length > 0) {
        await db.collection("assignments").insertMany(assignments)
    }

    console.log("Import done.")

    await client.close()
}

main()