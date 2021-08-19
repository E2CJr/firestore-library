const { v4:uuidv4 } = require("uuid");
const FirestoreConnection = require("./connection/FirestoreConnection");
const { generateDocName } = require("./common/commons");


class CompanyProvider extends FirestoreConnection {
  
  constructor(serviceAccount) {
    super(serviceAccount);
  }

  async index(ref=false) {
		const document = await this.db.collection(this.collectionCompany).get();
		return ref? document : document.docs.map(doc => {
			const { logs:_, ...rest } = doc.data();
			return rest;
		});
	}

  async getById(company, ref=false) {
    if (!company)
      throw new Error("É necessário informar o id da empresa");

		const hasCompany = await this.db
			.collection(this.collectionCompany)
			.where("id", "==", company)
			.get(); 
    
    if (ref) return hasCompany;

		if (hasCompany.empty) return null;

    const { logs:_, ...rest } = hasCompany.docs[0].data();
		return rest;
	}

  async save(data) {
		const document = this.db
			.collection(this.collectionCompany)
			.doc(generateDocName());

		return await document.set({ 
			...data,
			id: uuidv4(),
		});
	}

  async delete(id) {
		const document = await this.db
			.collection(this.collectionCompany)
			.where("id", "==", id)
			.get();

		if (document.empty) 
			throw new Error("ID não encontrado");

		await document.docs[0].ref.delete();
	}

	async update(id, data) {
		const document = await this.db
			.collection(this.collectionCompany)
			.where("id", "==", id)
			.get();

		if (document.empty) 
			throw new Error("ID não encontrado");

		await document.docs[0].ref.update({
			...data,
			id: document.docs[0].data().id,
		});
	}

}

module.exports = CompanyProvider;