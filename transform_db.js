// one-time database transformation for Assignment 4
// step 1: add empty employees array into each shift
// step 2: copy employee ObjectId values from assignments into shifts.employees
// step 3: remove old fields and drop assignments collection

const { setServers } = require("node:dns/promises")
setServers(["1.1.1.1", "8.8.8.8"])

require("dotenv").config()
const { MongoClient } = require("mongodb")

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.DB_NAME || "infs3201_winter2026"

/**
 * connect to MongoDB and return database and client
 * @returns {Promise<{db:any,client:any}>}
 */
async function getDb() {
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    return { db: client.db(DB_NAME), client: client }
}

/**
 * add an empty employees array to every shift
 * @param {any} db
 * @returns {Promise<void>}
 */
async function addEmptyEmployeesArray(db) {
    await db.collection("shifts").updateMany(
        {},
        { $set: { employees: [] } }
    )

    console.log("Step 1: empty employees array added to all shifts.")
}

/**
 * go through assignments and embed employee ObjectId into shift.employees
 * @param {any} db
 * @returns {Promise<void>}
 */
async function embedEmployeesInShifts(db) {
    const assignments = await db.collection("assignments").find({}).toArray()

    for (let i = 0; i < assignments.length; i++) {
        const oneAssignment = assignments[i]

        const employee = await db.collection("employees").findOne({
            employeeId: oneAssignment.employeeId
        })

        if (employee) {
            await db.collection("shifts").updateOne(
                { shiftId: oneAssignment.shiftId },
                { $addToSet: { employees: employee._id } }
            )
        }
    }

    console.log("Step 2: employee ObjectIds embedded into shifts.")
}

/**
 * remove old fields and drop assignments collection
 * @param {any} db
 * @returns {Promise<void>}
 */
async function cleanupOldData(db) {
    await db.collection("employees").updateMany(
        {},
        { $unset: { employeeId: "" } }
    )

    await db.collection("shifts").updateMany(
        {},
        { $unset: { shiftId: "" } }
    )

    await db.collection("assignments").drop()

    console.log("Step 3: old fields removed and assignments collection dropped.")
}

/**
 * run all transform steps
 * @returns {Promise<void>}
 */
async function main() {
    const conn = await getDb()
    const db = conn.db
    const client = conn.client

    await addEmptyEmployeesArray(db)
    await embedEmployeesInShifts(db)
    await cleanupOldData(db)

    await client.close()
}

main()