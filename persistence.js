// persistence layer
// this file only talks to json files (read/write)

// fix DNS problem for MongoDB Atlas (so host name can be resolved)
const { setServers } = require("node:dns/promises")
setServers(["1.1.1.1", "8.8.8.8"])

require("dotenv").config()
const { MongoClient } = require("mongodb")
const fs = require("fs/promises")

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.DB_NAME || "infs3201_winter2026"

let client = null

/**
 * This function connects to MongoDB.
 * If the connection does not exist, it creates it.
 * It returns the database object.
 * @returns {Promise<any>}
 */
async function getDb() {
    if (!client) {
        client = new MongoClient(MONGODB_URI)
        await client.connect()
    }
    return client.db(DB_NAME)
}

const CONFIG_FILE = "config.json"

/**
 * This function gets all employees from MongoDB.
 * It reads from the "employees" collection.
 * @returns {Promise<any[]>}
 */
async function getAllEmployees() {
    const db = await getDb()
    return await db.collection("employees").find({}).toArray()
}

/**
 * read config.json (maxDailyHours)
 * if anything wrong, return default 9
 * @returns {Promise<number>}
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
 * This function finds one employee in MongoDB
 * using the employeeId.
 * It searches inside the "employees" collection.
 * If found, it returns the employee object.
 * If not found, it returns null.
 * @param {string} employeeId - the id of the employee (ex: E001)
 * @returns {Promise<any|null>}
 */
async function findEmployee(employeeId) {
    const db = await getDb()
    return await db.collection("employees").findOne({ employeeId: employeeId })
}

/**
 * This function adds a new employee into MongoDB.
 * It inserts the employee object into the "employees" collection.
 * @param {any} employee - the employee object to save
 * @returns {Promise<void>}
 */
async function addEmployee(employee) {
    const db = await getDb()
    await db.collection("employees").insertOne(employee)
}

/**
 * This function gets all shifts from MongoDB.
 * It reads from the "shifts" collection.
 * @returns {Promise<any[]>}
 */
async function getAllShifts() {
    const db = await getDb()
    return await db.collection("shifts").find({}).toArray()
}

/**
 * This function finds one shift in MongoDB using shiftId.
 * It searches inside the "shifts" collection.
 * If not found, it returns null.
 * @param {string} shiftId - the id of the shift (ex: S001)
 * @returns {Promise<any|null>}
 */
async function findShift(shiftId) {
    const db = await getDb()
    return await db.collection("shifts").findOne({ shiftId: shiftId })
}

/**
 * This function gets all assignments for one employee from MongoDB.
 * It reads from the "assignments" collection.
 * @param {string} employeeId - the id of the employee (ex: E001)
 * @returns {Promise<any[]>}
 */
async function getAssignmentsByEmployee(employeeId) {
    const db = await getDb()
    return await db.collection("assignments").find({ employeeId: employeeId }).toArray()
}

module.exports = {
    getAllEmployees,
    findEmployee,
    addEmployee,
    getAllShifts,
    findShift,
    getAssignmentsByEmployee,
    getMaxDailyHours
}
