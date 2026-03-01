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

const EMPLOYEES_FILE = "employees.json"
const SHIFTS_FILE = "shifts.json"
const ASSIGNMENTS_FILE = "assignments.json"
const CONFIG_FILE = "config.json"

/**
 * reads a json file that has an array inside
 * if file missing or error, return []
 * @param {string} filename
 * @returns {Promise<any[]>}
 */
async function readJsonArray(filename) {
    try {
        const text = await fs.readFile(filename, "utf8")
        const data = JSON.parse(text)

        if (Array.isArray(data)) {
            return data
        }

        return []
    } catch (err) {
        return []
    }
}

/**
 * saves an array into a json file
 * @param {string} filename
 * @param {any[]} data
 * @returns {Promise<void>}
 */
async function writeJsonArray(filename, data) {
    const text = JSON.stringify(data, null, 4)
    await fs.writeFile(filename, text, "utf8")
}

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
 * get all shifts
 * @returns {Promise<any[]>}
 */
async function getAllShifts() {
    return await readJsonArray(SHIFTS_FILE)
}

/**
 * find one shift by id
 * @param {string} shiftId
 * @returns {Promise<any|undefined>}
 */
async function findShift(shiftId) {
    const shifts = await readJsonArray(SHIFTS_FILE)

    for (let i = 0; i < shifts.length; i++) {
        if (shifts[i].shiftId === shiftId) {
            return shifts[i]
        }
    }

    return undefined
}

/**
 * get all assignments for one employee
 * @param {string} employeeId
 * @returns {Promise<any[]>}
 */
async function getAssignmentsByEmployee(employeeId) {
    const assignments = await readJsonArray(ASSIGNMENTS_FILE)
    const result = []

    for (let i = 0; i < assignments.length; i++) {
        if (assignments[i].employeeId === employeeId) {
            result.push(assignments[i])
        }
    }

    return result
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
