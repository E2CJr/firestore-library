const { v4:uuidv4 } = require("uuid");
const CompanyProvider = require("./CompanyProvider.js");
const FirestoreConnection = require("./connection/FirestoreConnection");
const { generateDocName } = require("./common/commons");


class UserProvider extends FirestoreConnection {
  
  constructor(serviceAccount) {
		super(serviceAccount);
		this.companyProvider = new CompanyProvider(serviceAccount);
  }

	async index(company) {
		const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const users = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionUser)
			.get();
		
		return users.docs.map(user => user.data());
	}

  async save(company, data) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
				
		const document = this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionUser)
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
			.collection(this.collectionUser)
			.where("id", "==", id)
			.get();

		if (document.empty) 
			throw new Error("ID não encontrado");

		await document.docs[0].ref.update({
			...data,
			id: document.docs[0].data().id,
		});
	}

	async updateWithoutCompany(id, data) {
		const companies = await this.companyProvider.index(true);

		for (let i=0 ; i<companies.docs.length ; i++) {
			const user = await this.db
				.collection(this.collectionCompany)
				.doc(companies.docs[i].ref.path.split('/')[1])
				.collection(this.collectionUser)
				.where("id", "==", id)
				.get();
	
			if(!user.empty) {
				await user.docs[0].ref.update({
					...data,
					id: user.docs[0].data().id
				});
				return;
			}
		}
		throw new Error("ID não encontrado");
	}

	async delete(company, id) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
		
		const document = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionUser)
			.where("id", "==", id)
			.get();

		if (document.empty) 
			throw new Error("ID não encontrado");

		await document.docs[0].ref.delete();
	}

	async getUserCompanyByEmail(company, email) {
		const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const user = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionUser)
			.where("email", "==", email)
			.get();
		
		return user.empty? null : user.docs[0].data();
	}

	async getUserByEmail(email) {
		const companies = await this.companyProvider.index(true);

		for (let i=0 ; i<companies.docs.length ; i++) {
			const user = await this.db
				.collection(this.collectionCompany)
				.doc(companies.docs[i].ref.path.split('/')[1])
				.collection(this.collectionUser)
				.where("email", "==", email)
				.get();
	
			if(!user.empty) 
				return {
					user: user.docs[0].data(),
					company: companies.docs[i].data().id
				}
		}
	}

}

module.exports = UserProvider;