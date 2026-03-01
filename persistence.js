// persistence layer
// this file only talks to the database and config file
// no prompt and no console.log here

// Fix DNS problem for MongoDB Atlas (so host name can be resolved)
const { setServers } = require("node:dns/promises")
setServers(["1.1.1.1", "8.8.8.8"])

require("dotenv").config()
const { MongoClient } = require("mongodb")
const fs = require("fs/promises")

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.DB_NAME || "infs3201_winter2026"

const CONFIG_FILE = "config.json"

let client = null

/**
 * Connect to MongoDB and return the database object.
 * We connect only once and reuse the same client.
 * @returns {Promise<any>} MongoDB database object
 */
async function getDb() {
    if (!MONGODB_URI) {
        throw new Error("Missing MONGODB_URI in .env file.")
    }

    if (!client) {
        client = new MongoClient(MONGODB_URI)
        await client.connect()
    }

    return client.db(DB_NAME)
}

/**
 * Get all employees from MongoDB (employees collection).
 * @returns {Promise<any[]>} array of employee objects
 */
async function getAllEmployees() {
    const db = await getDb()
    return await db.collection("employees").find({}).toArray()
}

/**
 * Read maxDailyHours from config.json.
 * If the file is missing or invalid, return default value 9.
 * @returns {Promise<number>} max daily hours
 */
async function getMaxDailyHours() {
    try {
        const text = await fs.readFile(CONFIG_FILE, "utf8")
        const data = JSON.parse(text)

        const hours = Number(data.maxDailyHours)
        if (!hours || hours <= 0) {
            return 9
        }

        return hours
    } catch (err) {
        return 9
    }
}

/**
 * Find one employee by employeeId in MongoDB.
 * @param {string} employeeId - example "E003"
 * @returns {Promise<any|null>} employee object or null if not found
 */
async function findEmployee(employeeId) {
    const db = await getDb()
    const empId = String(employeeId || "").trim()

    return await db.collection("employees").findOne({ employeeId: empId })
}

/**
 * Add (insert) one employee document into MongoDB.
 * @param {any} employee - employee object to insert
 * @returns {Promise<void>}
 */
async function addEmployee(employee) {
    const db = await getDb()
    await db.collection("employees").insertOne(employee)
}

/**
 * Get all shifts from MongoDB (shifts collection).
 * @returns {Promise<any[]>} array of shift objects
 */
async function getAllShifts() {
    const db = await getDb()
    return await db.collection("shifts").find({}).toArray()
}

/**
 * Find one shift by shiftId in MongoDB.
 * @param {string} shiftId - example "S001"
 * @returns {Promise<any|null>} shift object or null
 */
async function findShift(shiftId) {
    const db = await getDb()
    const sId = String(shiftId || "").trim()

    return await db.collection("shifts").findOne({ shiftId: sId })
}

/**
 * Get all assignments for one employee from MongoDB.
 * @param {string} employeeId - example "E001"
 * @returns {Promise<any[]>} list of assignment objects
 */
async function getAssignmentsByEmployee(employeeId) {
    const db = await getDb()
    const empId = String(employeeId || "").trim()

    return await db.collection("assignments").find({ employeeId: empId }).toArray()
}

/**
 * Update one employee in MongoDB using updateOne (best practice).
 * We DO NOT delete the whole collection.
 * We only update name and phone for the matching employeeId.
 * @param {string} employeeId - example "E003"
 * @param {string} name - new name (already trimmed in business layer)
 * @param {string} phone - new phone (already trimmed in business layer)
 * @returns {Promise<boolean>} true if employee exists (matched), false otherwise
 */
async function updateEmployee(employeeId, name, phone) {
    const db = await getDb()
    const empId = String(employeeId || "").trim()

    const result = await db.collection("employees").updateOne(
        { employeeId: empId },
        { $set: { name: name, phone: phone } }
    )

    return result.matchedCount > 0
}

module.exports = {
    getAllEmployees,
    findEmployee,
    addEmployee,
    getAllShifts,
    findShift,
    getAssignmentsByEmployee,
    getMaxDailyHours,
    updateEmployee
}