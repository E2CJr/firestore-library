const { v4:uuidv4 } = require("uuid");
const CompanyProvider = require("./CompanyProvider.js");
const FirestoreConnection = require("./connection/FirestoreConnection");
const { generateDocName } = require("./common/commons");


class ClpProvider extends FirestoreConnection {
  
  constructor(serviceAccount) {
    super(serviceAccount);
    this.companyProvider = new CompanyProvider(serviceAccount);
  }

  async index(company) {
		const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const clps = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionClp)
			.get();
		
		return clps.docs.map(clp => clp.data());
	}

  async getById(company, id, ref=false) {
    const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const clp = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionClp)
      .where("id", "==", id)
      .get();

		if (ref) return clp;

		if (clp.empty) return null;
				
		return clp.docs[0].data();
  }

  async save(company, data) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
				
		const document = this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionClp)
			.doc(generateDocName());

		return await document.set({ 
			...data,
			id: uuidv4(),
		});
	}

  async update(company, id, data) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
		
		const document = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionClp)
			.where("id", "==", id)
			.get();

		if (document.empty) 
			throw new Error("ID não encontrado");

		await document.docs[0].ref.update({
			...data,
			id: document.docs[0].data().id,
			machines: document.docs[0].data().machines,
		});
	}

	async delete(company, id) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
		
		const document = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionClp)
			.where("id", "==", id)
			.get();

		if (document.empty) 
			throw new Error("ID não encontrado");

		await document.docs[0].ref.delete();
	}

	async saveInfos(company, id, data) {
		const clp = await this.getById(company, id, true);
		
		if (clp.empty) 
			throw new Error("ID não encontrado");

		const document = clp.docs[0].ref
			.collection(this.collectionClpInfos)
			.doc(generateDocName());
		
		const now = new Date();
		now.setHours(now.getHours() - now.getTimezoneOffset() / 60);
		
		return await document.set({ 
			...data,
			timestamp: now.getTime(),
		});
	}

	async getInfos(company, id, start, end) {
		const clp = await this.getById(company, id, true);
		
		if (clp.empty) 
			throw new Error("ID não encontrado");
			
		if (!end) {
			const now = new Date();
			now.setHours(now.getHours() - now.getTimezoneOffset() / 60);
			end = now.getTime();
		}
		
		if (!start) {
			const now = new Date();
			now.setHours(0,0,0,0)
			now.setHours(now.getHours() - now.getTimezoneOffset() / 60);
			start = now.getTime();
		}
		
		const document = await clp.docs[0].ref
			.collection(this.collectionClpInfos)
			.orderBy("timestamp")
			.startAt(start)
			.endAt(end)
			.get();
		
		return document.empty? [] : document.docs.map(doc => doc.data());
	}

}

module.exports = ClpProvider;