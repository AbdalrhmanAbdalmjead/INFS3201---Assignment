// presentation layer
// only here we use prompt and console.log

const promptSync = require("prompt-sync")
const business = require("./business")

const prompt = promptSync({ sigint: true })

/**
 * print the menu
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
 * just to make table look nicer
 * @param {string} value
 * @param {number} width
 * @returns {string}
 */
function padRight(value, width) {
    return String(value).padEnd(width, " ")
}

/**
 * find max name width (so the table lines up)
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
 * option 1: show employees
 * @returns {Promise<void>}
 */
async function showAllEmployees() {
    const employees = await business.getEmployees()

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
 * option 2: add employee
 * @returns {Promise<void>}
 */
async function addEmployeeMenu() {
    const name = prompt("Enter employee name: ").trim()
    const phone = prompt("Enter phone number: ").trim()

    const result = await business.addNewEmployee(name, phone)
    console.log(result.message)
}

/**
 * option 3: assign shift
 * @returns {Promise<void>}
 */
async function assignEmployeeMenu() {
    const employeeId = prompt("Enter employee ID: ").trim()
    const shiftId = prompt("Enter shift ID: ").trim()

    const result = await business.assignEmployeeToShift(employeeId, shiftId)
    console.log(result.message)
}

/**
 * option 4: view schedule
 * @returns {Promise<void>}
 */
async function viewScheduleMenu() {
    const employeeId = prompt("Enter employee ID: ").trim()

    console.log("date,startTime,endTime")

    const result = await business.getEmployeeSchedule(employeeId)

    if (!result.ok) {
        return
    }

    const rows = result.rows

    for (let i = 0; i < rows.length; i++) {
        console.log(rows[i].date + "," + rows[i].startTime + "," + rows[i].endTime)
    }
}

/**
 * main loop
 * @returns {Promise<void>}
 */
async function main() {
    while (true) {
        printMenu()
        const choice = prompt("What is your choice> ").trim()

        if (choice === "1") {
            await showAllEmployees()
        } else if (choice === "2") {
            await addEmployeeMenu()
        } else if (choice === "3") {
            await assignEmployeeMenu()
        } else if (choice === "4") {
            await viewScheduleMenu()
        } else if (choice === "5") {
            break
        } else {
            console.log("Invalid choice")
        }
    }
}

main()
