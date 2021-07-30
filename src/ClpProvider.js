const { v4:uuidv4 } = require("uuid");
const FirestoreConnection = require("./connection/FirestoreConnection");
const { generateDocName } = require("./common/commons");


class ClpProvider extends FirestoreConnection {
  
  constructor(serviceAccount) {
    super(serviceAccount);
  }
  
}

module.exports = ClpProvider;