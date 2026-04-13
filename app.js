const { setServers } = require("node:dns/promises")
setServers(["1.1.1.1", "8.8.8.8"])

const express = require("express")
const { engine } = require("express-handlebars")
const business = require("./business")
const cookieParser = require("cookie-parser")
const twoFactorStore = {}

const app = express()

app.use(cookieParser())

app.use(async (req, res, next) => {
    let username = null

    const sessionKey = req.cookies?.sessionKey

    if (sessionKey) {
        const session = await business.getSession(sessionKey)
        if (session && session.username) {
            username = session.username
        }
    }

    await business.logSecurityAccess(
        username,
        req.originalUrl,
        req.method
    )

    next()
})

app.use(express.urlencoded({ extended: false }))
app.use(express.static("public"))

app.engine("handlebars", engine({ defaultLayout: false }))
app.set("view engine", "handlebars")
app.set("views", "./views")

/**
 * middleware to check if user is authenticated
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns {Promise<void>}
 */
async function checkAuth(req, res, next) {
    const sessionKey = req.cookies?.sessionKey

    if (!sessionKey) {
        return res.redirect("/login?message=Please login first")
    }

    const session = await business.getSession(sessionKey)

    if (!session) {
        return res.redirect("/login?message=Session not found")
    }

    if (new Date(session.expiry) < new Date()) {
        return res.redirect("/login?message=Session expired")
    }

    await business.updateSession(sessionKey, new Date(Date.now() + 1000 * 60 * 5))

    res.setHeader(
        "Set-Cookie",
        "sessionKey=" + sessionKey + "; Max-Age=300; HttpOnly; Path=/"
    )

    next()
}

app.use(async (req, res, next) => {
    if (req.path === "/login" || req.path === "/logout" || req.path === "/2fa") {
        return next()
    }

    return await checkAuth(req, res, next)
})

/**
 * Show login page
 * URL: GET /login
 * @param {any} req
 * @param {any} res
 * @returns {void}
 */
app.get("/login", (req, res) => {
    const message = req.query.message || ""
    res.render("login", { message: message })
})

/**
 * Handle login submit
 * URL: POST /login
 * @param {any} req
 * @param {any} res
 * @returns {Promise<void>}
 */
app.post("/login", async (req, res) => {
    const username = req.body.username
    const password = req.body.password

    const result = await business.validateCredentials(username, password)

    if (!result.ok) {
        return res.redirect("/login?message=" + encodeURIComponent(result.message))
    }

    const user = result.user

    const code = Math.floor(100000 + Math.random() * 900000).toString()

    twoFactorStore[user.username] = {
        code: code,
        expiry: new Date(Date.now() + 1000 * 60 * 3)
    }

    const emailSystem = require("./emailSystem")
    await emailSystem.sendTwoFactorCodeEmail(user.username, code)

    return res.redirect("/2fa?user=" + encodeURIComponent(user.username))
})

/**
 * Show 2FA page
 * URL: GET /2fa
 * @param {any} req
 * @param {any} res
 * @returns {void}
 */
app.get("/2fa", (req, res) => {
    const username = req.query.user || ""
    const message = req.query.message || ""

    res.render("twofa", {
        username: username,
        message: message
    })
})

/**
 * Show logout page
 * URL: GET /logout
 * @param {any} req
 * @param {any} res
 * @returns {void}
 */
app.get("/logout", (req, res) => {
    res.render("logout")
})

/**
 * Handle logout submit
 * URL: POST /logout
 * @param {any} req
 * @param {any} res
 * @returns {Promise<void>}
 */
app.post("/logout", async (req, res) => {
    const cookieHeader = req.headers.cookie || ""
    let sessionKey = ""

    const parts = cookieHeader.split(";")

    for (let i = 0; i < parts.length; i++) {
        const one = parts[i].trim()
        if (one.startsWith("sessionKey=")) {
            sessionKey = one.substring("sessionKey=".length)
        }
    }

    if (sessionKey !== "") {
        await business.endSession(sessionKey)
    }

    res.setHeader(
        "Set-Cookie",
        "sessionKey=; Max-Age=0; HttpOnly; Path=/"
    )

    res.redirect("/login?message=" + encodeURIComponent("Logged out."))
})

/**
 * Landing page: list employee names as links
 * URL: GET /
 * @param {any} req
 * @param {any} res
 * @returns {Promise<void>}
 */
app.get("/", async (req, res) => {
    const employees = await business.getEmployees()
    res.render("home", { employees })
})

/**
 * Employee details page (name, phone, edit link, shifts table)
 * URL: GET /employee/:id
 * @param {any} req
 * @param {any} res
 * @returns {Promise<void>}
 */
app.get("/employee/:id", async (req, res) => {
    const employeeId = String(req.params.id || "").trim()
    const result = await business.getEmployeeDetailsPage(employeeId)

    if (!result.ok) {
        return res.send(result.message)
    }

    const rows = result.rows || []

    for (let i = 0; i < rows.length; i++) {
        const start = String(rows[i].startTime || "")
        const hour = Number(start.split(":")[0])
        rows[i].isMorning = !Number.isNaN(hour) && hour < 12
    }

    res.render("employee", {
        employee: result.employee,
        rows: rows
    })
})

/**
 * Show edit form (prefilled)
 * URL: GET /edit/:id
 * @param {any} req
 * @param {any} res
 * @returns {Promise<void>}
 */
app.get("/edit/:id", async (req, res) => {
    const employeeId = String(req.params.id || "").trim()
    const employee = await business.getEmployeeById(employeeId)

    if (!employee) {
        return res.send("Employee not found.")
    }

    res.render("edit", { employee })
})

/**
 * Handle edit submit (server validation + updateOne + PRG redirect)
 * URL: POST /edit/:id
 * @param {any} req
 * @param {any} res
 * @returns {Promise<void>}
 */
app.post("/edit/:id", async (req, res) => {
    const employeeId = String(req.params.id || "").trim()
    const name = req.body.name
    const phone = req.body.phone

    const result = await business.updateEmployeeDetails(employeeId, name, phone)

    if (!result.ok) {
        const employee = await business.getEmployeeById(employeeId)

        if (!employee) {
            return res.send("Employee not found.")
        }

        employee.name = name
        employee.phone = phone

        return res.render("edit", {
            employee: employee,
            error: result.message
        })
    }

    res.redirect("/")
})

/**
 * Add employee form
 * URL: GET /add
 * @param {any} req
 * @param {any} res
 * @returns {void}
 */
app.get("/add", (req, res) => {
    res.render("add")
})

/**
 * Add employee submit
 * URL: POST /add
 * @param {any} req
 * @param {any} res
 * @returns {Promise<void>}
 */
app.post("/add", async (req, res) => {
    const name = req.body.name
    const phone = req.body.phone

    const result = await business.addNewEmployee(name, phone)

    if (!result.ok) {
        return res.render("add", { error: result.message })
    }

    res.redirect("/")
})

/**
 * Start server on port 8000
 * @returns {void}
 */
app.listen(8000, () => {
    console.log("Server running on http://localhost:8000")
})