// email system
// for assignment submission, emails are only printed to console
// the rest of the system should call these functions like a real email service

/**
 * send one email
 * @param {string} to
 * @param {string} subject
 * @param {string} message
 * @returns {Promise<void>}
 */
async function sendEmail(to, subject, message) {
    const emailTo = String(to || "").trim()
    const emailSubject = String(subject || "").trim()
    const emailMessage = String(message || "").trim()

    console.log("----- EMAIL START -----")
    console.log("To: " + emailTo)
    console.log("Subject: " + emailSubject)
    console.log("Message: " + emailMessage)
    console.log("----- EMAIL END -----")
}

/**
 * send 2FA code email
 * @param {string} to
 * @param {string} code
 * @returns {Promise<void>}
 */
async function sendTwoFactorCodeEmail(to, code) {
    await sendEmail(
        to,
        "Your 2FA Code",
        "Your verification code is: " + code + ". This code expires in 3 minutes."
    )
}

/**
 * send suspicious activity warning email
 * @param {string} to
 * @returns {Promise<void>}
 */
async function sendSuspiciousActivityEmail(to) {
    await sendEmail(
        to,
        "Suspicious Activity Warning",
        "There have been multiple invalid login attempts on your account."
    )
}

/**
 * send account locked email
 * @param {string} to
 * @returns {Promise<void>}
 */
async function sendAccountLockedEmail(to) {
    await sendEmail(
        to,
        "Account Locked",
        "Your account has been locked after too many invalid login attempts."
    )
}

module.exports = {
    sendEmail,
    sendTwoFactorCodeEmail,
    sendSuspiciousActivityEmail,
    sendAccountLockedEmail
}