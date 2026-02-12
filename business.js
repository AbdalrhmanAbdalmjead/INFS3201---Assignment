// business layer
// this file has the rules and checks
// no prompt and no console.log here

const persistence = require("./persistence")

/**
 * make new employee id like E001, E002 ...
 * @param {{employeeId:string}[]} employees
 * @returns {string}
 */
function getNextEmployeeId(employees) {
    let maxNumber = 0

    for (let i = 0; i < employees.length; i++) {
        const id = employees[i].employeeId
        const number = Number(String(id).substring(1))
        if (number > maxNumber) {
            maxNumber = number
        }
    }

    return "E" + String(maxNumber + 1).padStart(3, "0")
}

/**
 * get employees list
 * @returns {Promise<any[]>}
 */
async function getEmployees() {
    return await persistence.getAllEmployees()
}

/**
 * add new employee (simple checks)
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<{ok:boolean,message:string}>}
 */
async function addNewEmployee(name, phone) {
    const n = String(name || "").trim()
    const p = String(phone || "").trim()

    if (n === "" || p === "") {
        return { ok: false, message: "Invalid input." }
    }

    const employees = await persistence.getAllEmployees()

    const employee = {
        employeeId: getNextEmployeeId(employees),
        name: n,
        phone: p
    }

    await persistence.addEmployee(employee)

    return { ok: true, message: "Employee added..." }
}

/**
 * assign employee to a shift (basic checks only for now)
 * @param {string} employeeId
 * @param {string} shiftId
 * @returns {Promise<{ok:boolean,message:string}>}
 */
async function assignEmployeeToShift(employeeId, shiftId) {
    const empId = String(employeeId || "").trim()
    const shId = String(shiftId || "").trim()

    if (empId === "" || shId === "") {
        return { ok: false, message: "Invalid input." }
    }

    const employee = await persistence.findEmployee(empId)
    if (!employee) {
        return { ok: false, message: "Employee does not exist" }
    }

    const shift = await persistence.findShift(shId)
    if (!shift) {
        return { ok: false, message: "Shift does not exist" }
    }

    const existing = await persistence.findAssignment(empId, shId)
    if (existing) {
        return { ok: false, message: "Employee already assigned to shift" }
    }

    await persistence.addAssignment({ employeeId: empId, shiftId: shId })

    return { ok: true, message: "Shift Recorded" }
}

/**
 * simple bubble sort for shifts (so it prints in order)
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
 * get schedule for employee (returns shift objects)
 * @param {string} employeeId
 * @returns {Promise<{ok:boolean,message?:string,rows?:any[]}>}
 */
async function getEmployeeSchedule(employeeId) {
    const empId = String(employeeId || "").trim()

    const employee = await persistence.findEmployee(empId)
    if (!employee) {
        return { ok: false, message: "" }
    }

    const assignments = await persistence.getAssignmentsByEmployee(empId)
    const rows = []

    for (let i = 0; i < assignments.length; i++) {
        const shift = await persistence.findShift(assignments[i].shiftId)
        if (shift) {
            rows.push(shift)
        }
    }

    sortShifts(rows)

    return { ok: true, rows: rows }
}

module.exports = {
    getEmployees,
    addNewEmployee,
    assignEmployeeToShift,
    getEmployeeSchedule
}
