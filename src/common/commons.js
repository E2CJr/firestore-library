const { randomBytes } = require("crypto");

module.exports = {
  generateDocName: () => randomBytes(10).toString("hex"),
  getEndDate: () => {
    const now = new Date();
    now.setHours(now.getHours() - now.getTimezoneOffset() / 60);
    return now.getTime();
  },
  getStartDate: () => {
    const now = new Date();
    now.setHours(0,0,0,0)
    now.setHours(now.getHours() - now.getTimezoneOffset() / 60);
    return now.getTime();
  }
}