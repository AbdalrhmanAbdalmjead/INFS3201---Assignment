const { setServers } = require("node:dns/promises")
setServers(["1.1.1.1", "8.8.8.8"])

const express = require("express")
const { engine } = require("express-handlebars")
const business = require("./business")

const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(express.static("public"))

app.engine("handlebars", engine({ defaultLayout: false }))
app.set("view engine", "handlebars")
app.set("views", "./views")

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

    res.redirect("/")
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
        return res.send(result.message)
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