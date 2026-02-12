// persistence layer
// this file only talks to json files (read/write)

const fs = require("fs/promises")

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
 * get all employees
 * @returns {Promise<any[]>}
 */
async function getAllEmployees() {
    return await readJsonArray(EMPLOYEES_FILE)
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
 * find one employee by id
 * @param {string} employeeId
 * @returns {Promise<any|undefined>}
 */
async function findEmployee(employeeId) {
    const employees = await readJsonArray(EMPLOYEES_FILE)

    for (let i = 0; i < employees.length; i++) {
        if (employees[i].employeeId === employeeId) {
            return employees[i]
        }
    }

    return undefined
}

/**
 * add one employee to employees.json
 * @param {any} employee
 * @returns {Promise<void>}
 */
async function addEmployee(employee) {
    const employees = await readJsonArray(EMPLOYEES_FILE)
    employees.push(employee)
    await writeJsonArray(EMPLOYEES_FILE, employees)
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
 * get all assignments
 * @returns {Promise<any[]>}
 */
async function getAllAssignments() {
    return await readJsonArray(ASSIGNMENTS_FILE)
}

/**
 * add one assignment (employeeId + shiftId)
 * @param {{employeeId:string, shiftId:string}} assignment
 * @returns {Promise<void>}
 */
async function addAssignment(assignment) {
    const assignments = await readJsonArray(ASSIGNMENTS_FILE)
    assignments.push(assignment)
    await writeJsonArray(ASSIGNMENTS_FILE, assignments)
}

/**
 * check if assignment exists already
 * @param {string} employeeId
 * @param {string} shiftId
 * @returns {Promise<any|undefined>}
 */
async function findAssignment(employeeId, shiftId) {
    const assignments = await readJsonArray(ASSIGNMENTS_FILE)

    for (let i = 0; i < assignments.length; i++) {
        if (
            assignments[i].employeeId === employeeId &&
            assignments[i].shiftId === shiftId
        ) {
            return assignments[i]
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
    getAllAssignments,
    addAssignment,
    findAssignment,
    getAssignmentsByEmployee
}
