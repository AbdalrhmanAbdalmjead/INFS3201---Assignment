const { setServers } = require("node:dns/promises")
setServers(["1.1.1.1", "8.8.8.8"])


const express = require("express")
const { engine } = require("express-handlebars")
const business = require("./business")

const app = express()

app.use(express.static("public"))

app.use(express.urlencoded({ extended: false }))

app.engine("handlebars", engine({ defaultLayout: false }))
app.set("view engine", "handlebars")
app.set("views", "./views")

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
 * Employee details page
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

    const rows = result.rows

    
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
 * This route shows the add employee form.
 * It simply renders the add.handlebars page.
 * @param {any} req - express request object
 * @param {any} res - express response object
 * @returns {void}
 */
app.get("/add", (req, res) => {
    res.render("add")
})

/**
 * This route handles the add employee form submission.
 * It performs server-side validation using the business layer.
 * If there is an error, it re-renders the form with an error message.
 * If successful, it redirects to the home page.
 * @param {any} req - express request object
 * @param {any} res - express response object
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
 * This route shows the schedule of one employee.
 * It gets the employeeId from the URL parameter.
 * It loads schedule data from the business layer.
 * If employee does not exist, it shows an error.
 * @param {any} req - express request object
 * @param {any} res - express response object
 * @returns {Promise<void>}
 */
app.get("/schedule/:id", async (req, res) => {
    const employeeId = req.params.id

    const result = await business.getEmployeeSchedule(employeeId)

    if (!result.ok) {
        return res.render("schedule", { error: "Employee not found." })
    }

    res.render("schedule", { rows: result.rows, employeeId })
})

/**
 * This function starts the Express server
 * on port 8000.
 * @returns {void}
 */
app.listen(8000, () => {
    console.log("Server running on http://localhost:8000")
})