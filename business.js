// business layer
// this file has the rules and checks
// no prompt and no console.log here

const persistence = require("./persistence")
const crypto = require("crypto")

/**
 * compute how many hours between startTime and endTime
 * example: 11:00 to 13:30 = 2.5 hours
 *
 * LLM used: ChatGPT (GPT-5.2 Thinking)
 *
 * @param {string} startTime
 * @param {string} endTime
 * @returns {number}
 */
function computeShiftDuration(startTime, endTime) {
    const s = String(startTime || "").trim()
    const e = String(endTime || "").trim()

    const sParts = s.split(":")
    const eParts = e.split(":")

    if (sParts.length !== 2 || eParts.length !== 2) {
        return 0
    }

    const sh = Number(sParts[0])
    const sm = Number(sParts[1])
    const eh = Number(eParts[0])
    const em = Number(eParts[1])

    if (
        Number.isNaN(sh) || Number.isNaN(sm) ||
        Number.isNaN(eh) || Number.isNaN(em)
    ) {
        return 0
    }

    if (
        sh < 0 || sh > 23 || eh < 0 || eh > 23 ||
        sm < 0 || sm > 59 || em < 0 || em > 59
    ) {
        return 0
    }

    let startMinutes = sh * 60 + sm
    let endMinutes = eh * 60 + em

    if (endMinutes < startMinutes) {
        endMinutes = endMinutes + 24 * 60
    }

    const diffMinutes = endMinutes - startMinutes
    return diffMinutes / 60
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

    if (n === "") {
        return { ok: false, message: "Name must not be empty." }
    }

    if (!isValidPhone(p)) {
        return { ok: false, message: "Phone must be like 5555-0101." }
    }

    const employee = {
        name: n,
        phone: p
    }

    await persistence.addEmployee(employee)

    return { ok: true, message: "Employee added..." }
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

    const rows = await persistence.getShiftsByEmployee(empId)
    sortShifts(rows)

    return { ok: true, rows: rows }
}

/**
 * Get one employee by id
 * @param {string} employeeId
 * @returns {Promise<any|null>}
 */
async function getEmployeeById(employeeId) {
    const empId = String(employeeId || "").trim()
    const employee = await persistence.findEmployee(empId)

    if (!employee) {
        return null
    }

    return employee
}

/**
 * Get employee details + his shifts (sorted) for the employee details page
 * @param {string} employeeId
 * @returns {Promise<{ok:boolean, employee?:any, rows?:any[], message?:string}>}
 */
async function getEmployeeDetailsPage(employeeId) {
    const empId = String(employeeId || "").trim()

    const employee = await persistence.findEmployee(empId)
    if (!employee) {
        return { ok: false, message: "Employee not found." }
    }

    const result = await getEmployeeSchedule(empId)
    if (!result.ok) {
        return { ok: true, employee, rows: [] }
    }

    return { ok: true, employee, rows: result.rows }
}

/**
 * Check phone format: 4 digits, dash, 4 digits (example: 5555-0101).
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
    return /^[0-9]{4}-[0-9]{4}$/.test(phone)
}

/**
 * Update employee details (server-side validation).
 * If valid, it calls persistence.updateEmployee() (updateOne).
 * @param {string} employeeId
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<{ok:boolean, message:string}>}
 */
async function updateEmployeeDetails(employeeId, name, phone) {
    const empId = String(employeeId || "").trim()
    const n = String(name || "").trim()
    const p = String(phone || "").trim()

    if (empId === "") {
        return { ok: false, message: "Invalid employee id." }
    }

    if (n === "") {
        return { ok: false, message: "Name must not be empty." }
    }

    if (!isValidPhone(p)) {
        return { ok: false, message: "Phone must be like 5555-0101." }
    }

    const updated = await persistence.updateEmployee(empId, n, p)

    if (!updated) {
        return { ok: false, message: "Employee not found." }
    }

    return { ok: true, message: "Saved." }
}

/**
 * hash password using sha256
 * @param {string} password
 * @returns {string}
 */
function hashPassword(password) {
    return crypto.createHash("sha256").update(String(password || "")).digest("hex")
}

/**
 * validate username and password for login
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ok:boolean,message:string,user?:any}>}
 */
async function validateCredentials(username, password) {
    const uname = String(username || "").trim()
    const pword = String(password || "").trim()

    if (uname === "" || pword === "") {
        return { ok: false, message: "Invalid username or password." }
    }

    const user = await persistence.findUserByUsername(uname)

    if (!user) {
        return { ok: false, message: "Invalid username or password." }
    }

    if (user.locked === true) {
        return { ok: false, message: "Account is locked." }
    }

    const hashed = hashPassword(pword)

    if (hashed !== user.password) {
        await persistence.increaseFailedLoginAttempts(uname)
        return { ok: false, message: "Invalid username or password." }
    }

    await persistence.resetFailedLoginAttempts(uname)

    return { ok: true, message: "Login successful.", user: user }
}

/**
 * start login session for one user
 * @param {any} user
 * @returns {Promise<string>}
 */
async function startSession(user) {
    const sessionKey = crypto.randomUUID()
    const expiry = new Date(Date.now() + 5 * 60 * 1000)

    const session = {
        sessionKey: sessionKey,
        username: user.username,
        expiry: expiry
    }

    await persistence.addSession(session)

    return sessionKey
}

/**
 * get one session if still valid
 * @param {string} sessionKey
 * @returns {Promise<any|null>}
 */
async function getSession(sessionKey) {
    const key = String(sessionKey || "").trim()

    if (key === "") {
        return null
    }

    const session = await persistence.findSession(key)

    if (!session) {
        return null
    }

    if (new Date(session.expiry).getTime() < Date.now()) {
        await persistence.deleteSession(key)
        return null
    }

    return session
}

/**
 * delete one session
 * @param {string} sessionKey
 * @returns {Promise<void>}
 */
async function endSession(sessionKey) {
    await persistence.deleteSession(sessionKey)
}

/**
 * log one request into security_log collection
 * @param {string|null} username
 * @param {string} url
 * @param {string} method
 * @returns {Promise<void>}
 */
async function logSecurityAccess(username, url, method) {
    await persistence.insertSecurityLog({
        timestamp: new Date(),
        username: username || null,
        url: url,
        method: method
    })
}

/**
 * update session expiry
 * @param {string} sessionKey
 * @param {Date} expiry
 * @returns {Promise<void>}
 */
async function updateSession(sessionKey, expiry) {
    await persistence.updateSessionExpiry(sessionKey, expiry)
}

/**
 * get one user by username
 * @param {string} username
 * @returns {Promise<any|null>}
 */
async function getUserByUsername(username) {
    const uname = String(username || "").trim()

    if (uname === "") {
        return null
    }

    return await persistence.findUserByUsername(uname)
}

module.exports = {
    getEmployees,
    addNewEmployee,
    getEmployeeSchedule,
    computeShiftDuration,
    getEmployeeById,
    getEmployeeDetailsPage,
    updateEmployeeDetails,
    validateCredentials,
    hashPassword,
    startSession,
    getSession,
    endSession,
    logSecurityAccess,
    updateSession,
    getUserByUsername
}