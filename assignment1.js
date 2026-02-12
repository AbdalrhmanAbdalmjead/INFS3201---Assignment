// Import modules
const fs = require("fs/promises")        // Read/write JSON files
const promptSync = require("prompt-sync") // User input

// Create prompt function
const prompt = promptSync({ sigint: true })

// File names
const EMPLOYEES_FILE = "employees.json"
const SHIFTS_FILE = "shifts.json"
const ASSIGNMENTS_FILE = "assignments.json"

/**
 * Reads a JSON file and returns its data as an array.
 * If something goes wrong, it returns an empty array.
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
 * Writes an array into a JSON file.
 * @param {string} filename
 * @param {any[]} data
 * @returns {Promise<void>}
 */
async function writeJsonArray(filename, data) {
    const text = JSON.stringify(data, null, 4)
    await fs.writeFile(filename, text, "utf8")
}

/**
 * Prints the main menu options.
 * @returns {void}
 */
function printMenu() {
    console.log("")
    console.log("1. Show all employees")
    console.log("2. Add new employee")
    console.log("3. Assign employee to shift")
    console.log("4. View employee schedule")
    console.log("5. Exit")
}

/**
 * Adds spaces to the right so the table looks neat.
 * @param {string} value
 * @param {number} width
 * @returns {string}
 */
function padRight(value, width) {
    return String(value).padEnd(width, " ")
}

/**
 * Finds the longest employee name.
 * Used only for table formatting.
 * @param {{name:string}[]} employees
 * @returns {number}
 */
function getMaxNameWidth(employees) {
    let max = 4
    for (let i = 0; i < employees.length; i++) {
        const name = String(employees[i].name || "")
        if (name.length > max) {
            max = name.length
        }
    }
    return max
}

/**
 * Option 1:
 * Shows all employees from employees.json.
 * @returns {Promise<void>}
 */
async function showAllEmployees() {
    const employees = await readJsonArray(EMPLOYEES_FILE)

    const nameWidth = getMaxNameWidth(employees)
    const idWidth = 11
    const phoneWidth = 9

    console.log("")
    console.log(
        padRight("Employee ID", idWidth) + " " +
        padRight("Name", nameWidth) + " " +
        padRight("Phone", phoneWidth)
    )

    console.log(
        padRight("-----------", idWidth) + " " +
        padRight("-------------------", nameWidth) + " " +
        padRight("---------", phoneWidth)
    )

    for (let i = 0; i < employees.length; i++) {
        const emp = employees[i]
        console.log(
            padRight(emp.employeeId, idWidth) + " " +
            padRight(emp.name, nameWidth) + " " +
            padRight(emp.phone, phoneWidth)
        )
    }
}

/**
 * Creates the next employee ID 
 * @param {{employeeId:string}[]} employees
 * @returns {string}
 */
function getNextEmployeeId(employees) {
    let maxNumber = 0

    for (let i = 0; i < employees.length; i++) {
        const id = employees[i].employeeId
        const number = Number(id.substring(1))
        if (number > maxNumber) {
            maxNumber = number
        }
    }

    return "E" + String(maxNumber + 1).padStart(3, "0")
}

/**
 * Option 2:
 * Adds a new employee and saves it to employees.json.
 * @returns {Promise<void>}
 */
async function addNewEmployee() {
    const name = prompt("Enter employee name: ").trim()
    const phone = prompt("Enter phone number: ").trim()

    if (name === "" || phone === "") {
        console.log("Invalid input.")
        return
    }

    const employees = await readJsonArray(EMPLOYEES_FILE)

    employees.push({
        employeeId: getNextEmployeeId(employees),
        name: name,
        phone: phone
    })

    await writeJsonArray(EMPLOYEES_FILE, employees)
    console.log("Employee added...")
}

/**
 * Checks if an employee ID exists.
 * @param {{employeeId:string}[]} employees
 * @param {string} employeeId
 * @returns {boolean}
 */
function employeeExists(employees, employeeId) {
    for (let i = 0; i < employees.length; i++) {
        if (employees[i].employeeId === employeeId) {
            return true
        }
    }
    return false
}

/**
 * Checks if a shift ID exists.
 * @param {{shiftId:string}[]} shifts
 * @param {string} shiftId
 * @returns {boolean}
 */
function shiftExists(shifts, shiftId) {
    for (let i = 0; i < shifts.length; i++) {
        if (shifts[i].shiftId === shiftId) {
            return true
        }
    }
    return false
}

/**
 * Checks if the employee is already assigned to the same shift.
 * @param {{employeeId:string, shiftId:string}[]} assignments
 * @param {string} employeeId
 * @param {string} shiftId
 * @returns {boolean}
 */
function isAlreadyAssigned(assignments, employeeId, shiftId) {
    for (let i = 0; i < assignments.length; i++) {
        if (
            assignments[i].employeeId === employeeId &&
            assignments[i].shiftId === shiftId
        ) {
            return true
        }
    }
    return false
}

/**
 * Option 3:
 * Assigns an employee to a shift after checking rules.
 * @returns {Promise<void>}
 */
async function assignEmployeeToShift() {
    const employeeId = prompt("Enter employee ID: ").trim()
    const shiftId = prompt("Enter shift ID: ").trim()

    const employees = await readJsonArray(EMPLOYEES_FILE)
    const shifts = await readJsonArray(SHIFTS_FILE)
    const assignments = await readJsonArray(ASSIGNMENTS_FILE)

    if (!employeeExists(employees, employeeId)) {
        console.log("Employee does not exist")
        return
    }

    if (!shiftExists(shifts, shiftId)) {
        console.log("Shift does not exist")
        return
    }

    if (isAlreadyAssigned(assignments, employeeId, shiftId)) {
        console.log("Employee already assigned to shift")
        return
    }

    assignments.push({ employeeId, shiftId })
    await writeJsonArray(ASSIGNMENTS_FILE, assignments)

    console.log("Shift Recorded")
}

/**
 * Finds a shift by shift ID.
 * @param {{shiftId:string}[]} shifts
 * @param {string} shiftId
 * @returns {object|null}
 */
function findShiftById(shifts, shiftId) {
    for (let i = 0; i < shifts.length; i++) {
        if (shifts[i].shiftId === shiftId) {
            return shifts[i]
        }
    }
    return null
}

/**
 * Sorts shifts by date and start time.
 * @param {{date:string,startTime:string,endTime:string}[]} rows
 * @returns {void}
 */
function sortShifts(rows) {
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows.length - 1; j++) {
            if (
                rows[j].date + rows[j].startTime >
                rows[j + 1].date + rows[j + 1].startTime
            ) {
                const temp = rows[j]
                rows[j] = rows[j + 1]
                rows[j + 1] = temp
            }
        }
    }
}

/**
 * Option 4:
 * Shows the schedule of an employee.
 * @returns {Promise<void>}
 */
async function viewEmployeeSchedule() {
    const employeeId = prompt("Enter employee ID: ").trim()

    const employees = await readJsonArray(EMPLOYEES_FILE)
    const shifts = await readJsonArray(SHIFTS_FILE)
    const assignments = await readJsonArray(ASSIGNMENTS_FILE)

    console.log("date,startTime,endTime")

    if (!employeeExists(employees, employeeId)) {
        return
    }

    const rows = []

    for (let i = 0; i < assignments.length; i++) {
        if (assignments[i].employeeId === employeeId) {
            const shift = findShiftById(shifts, assignments[i].shiftId)
            if (shift) {
                rows.push(shift)
            }
        }
    }

    sortShifts(rows)

    for (let i = 0; i < rows.length; i++) {
        console.log(rows[i].date + "," + rows[i].startTime + "," + rows[i].endTime)
    }
}

/**
 * Main program loop.
 * @returns {Promise<void>}
 */
async function main() {
    while (true) {
        printMenu()
        const choice = prompt("What is your choice> ").trim()

        if (choice === "1") {
            await showAllEmployees()
        } else if (choice === "2") {
            await addNewEmployee()
        } else if (choice === "3") {
            await assignEmployeeToShift()
        } else if (choice === "4") {
            await viewEmployeeSchedule()
        } else if (choice === "5") {
            break
        } else {
            console.log("Invalid choice")
        }
    }
}

main()
