const { v4:uuidv4 } = require("uuid");
const CompanyProvider = require("./CompanyProvider.js");
const { generateDocName } = require("./common/commons");

class InternalErrorsProvider extends CompanyProvider {

  constructor(serviceAccount) {
		super(serviceAccount);
  }

  async index(company) {
    const hasCompany = await this.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("ID não encontrado");
					
		const document = await hasCompany.docs[0].ref
			.collection(this.collectionInternalErrors)
			.get();
		
		return document.empty? [] : document.docs.map(doc => doc.data());
  }

	async save(company, data) {
		const hasCompany = await this.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("ID não encontrado");

		const document = hasCompany.docs[0].ref
			.collection(this.collectionInternalErrors)
			.doc(generateDocName());
				
		return await document.set({ 
      ...data,
			id: uuidv4(),
		});
	}

}

module.exports = InternalErrorsProvider;