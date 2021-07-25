const { randomBytes } = require("crypto");

module.exports = {
  generateDocName: () => randomBytes(10).toString("hex"),
}