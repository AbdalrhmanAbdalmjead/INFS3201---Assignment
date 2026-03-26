const crypto = require("crypto")

function makeHash(password) {
    return crypto.createHash("sha256").update(password).digest("hex")
}

console.log("user1 password hash:", makeHash("pass1234"))
console.log("user2 password hash:", makeHash("hello123"))