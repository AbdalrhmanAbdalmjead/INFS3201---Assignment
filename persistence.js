// persistence layer
// this file only talks to the database and config file
// no prompt and no console.log here

const { setServers } = require("node:dns/promises")
setServers(["1.1.1.1", "8.8.8.8"])

require("dotenv").config()
const { MongoClient, ObjectId } = require("mongodb")
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
 * Find one employee by _id in MongoDB.
 * @param {string} employeeId
 * @returns {Promise<any|null>} employee object or null if not found
 */
async function findEmployee(employeeId) {
    const db = await getDb()
    const empId = String(employeeId || "").trim()

    if (!ObjectId.isValid(empId)) {
        return null
    }

    return await db.collection("employees").findOne({
        _id: new ObjectId(empId)
    })
}

/**
 * Add (insert) one employee document into MongoDB.
 * @param {any} employee
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
 * Get all shifts for one employee by checking embedded employees array.
 * @param {string} employeeId
 * @returns {Promise<any[]>} list of shift objects
 */
async function getShiftsByEmployee(employeeId) {
    const db = await getDb()
    const empId = String(employeeId || "").trim()

    if (!ObjectId.isValid(empId)) {
        return []
    }

    return await db.collection("shifts").find({
        employees: new ObjectId(empId)
    }).toArray()
}

/**
 * Update one employee in MongoDB using updateOne.
 * We only update name and phone for the matching _id.
 * @param {string} employeeId
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<boolean>} true if employee exists, false otherwise
 */
async function updateEmployee(employeeId, name, phone) {
    const db = await getDb()
    const empId = String(employeeId || "").trim()

    if (!ObjectId.isValid(empId)) {
        return false
    }

    const result = await db.collection("employees").updateOne(
        { _id: new ObjectId(empId) },
        { $set: { name: name, phone: phone } }
    )

    return result.matchedCount > 0
}

/**
 * validate login credentials
 * @param {string} username
 * @returns {Promise<any|null>}
 */
async function findUserByUsername(username) {
    const db = await getDb()
    const uname = String(username || "").trim()

    return await db.collection("users").findOne({
        username: uname
    })
}

/**
 * create one session in MongoDB
 * @param {any} session
 * @returns {Promise<void>}
 */
async function addSession(session) {
    const db = await getDb()
    await db.collection("sessions").insertOne(session)
}

/**
 * find one session by session key
 * @param {string} sessionKey
 * @returns {Promise<any|null>}
 */
async function findSession(sessionKey) {
    const db = await getDb()
    const key = String(sessionKey || "").trim()

    return await db.collection("sessions").findOne({
        sessionKey: key
    })
}

/**
 * delete one session by session key
 * @param {string} sessionKey
 * @returns {Promise<void>}
 */
async function deleteSession(sessionKey) {
    const db = await getDb()
    const key = String(sessionKey || "").trim()

    await db.collection("sessions").deleteOne({
        sessionKey: key
    })
}

/**
 * update session expiry time
 * @param {string} sessionKey
 * @param {Date} expiry
 * @returns {Promise<void>}
 */
async function updateSessionExpiry(sessionKey, expiry) {
    const db = await getDb()
    const key = String(sessionKey || "").trim()

    await db.collection("sessions").updateOne(
        { sessionKey: key },
        { $set: { expiry: expiry } }
    )
}

module.exports = {
    getAllEmployees,
    findEmployee,
    addEmployee,
    getAllShifts,
    getShiftsByEmployee,
    getMaxDailyHours,
    updateEmployee,
    findUserByUsername,
    addSession,
    findSession,
    deleteSession,
    updateSessionExpiry
}