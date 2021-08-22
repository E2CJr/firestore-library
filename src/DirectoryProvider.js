const { generateDocName, getPath } = require("./common/commons");
const CompanyProvider = require("./CompanyProvider.js");
const FirestoreConnection = require("./connection/FirestoreConnection");


class DirectoryProvider extends FirestoreConnection {

  constructor(serviceAccount) {
    super(serviceAccount);
    this.companyProvider = new CompanyProvider(serviceAccount);
  }
  
  async index(company) {
		const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const directories = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionDirectory)
      .get();
				
		return directories.docs.map(doc => doc.data());
	}

	async getById(company, id, ref=false) {
    const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const folder = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionDirectory)
      .where("id", "==", id)
      .get();

		if (ref) return folder;
				
		return folder.empty ? null : folder.docs[0].data();
  }
  
}

module.exports = DirectoryProvider;