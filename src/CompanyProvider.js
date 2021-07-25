const { v4:uuidv4 } = require("uuid");
const FirestoreProvider = require("./FirestoreProvider");
const { generateDocName } = require("./common/commons");


class CompanyProvider extends FirestoreProvider {
  
  constructor(serviceAccount) {
    super(serviceAccount);
  }

  async index(ref=false) {
		const document = await this.db.collection(this.collectionCompany).get();
		return ref? document : document.docs.map(doc => doc.data());
	}

  async getById(company, ref=false) {
    if (!company)
      throw new Error("É necessário informar o id da empresa");

		const hasCompany = await this.db
			.collection(this.collectionCompany)
			.where("id", "==", company)
			.get(); 
    
    if (ref) return hasCompany;

    return hasCompany.empty ? null : hasCompany.docs[0].data();
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