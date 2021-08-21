const { v4:uuidv4 } = require("uuid");
const { generateDocName } = require("./common/commons");
const CompanyProvider = require("./CompanyProvider.js");
const FirestoreConnection = require("./connection/FirestoreConnection");


class DirectoryProvider extends FirestoreConnection {

  constructor(serviceAccount) {
    super(serviceAccount);
    this.companyProvider = new CompanyProvider(serviceAccount);
  }
  
}

module.exports = DirectoryProvider;