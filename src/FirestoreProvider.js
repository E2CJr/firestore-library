const { v4:uuidv4 } = require("uuid");
const admin = require("firebase-admin");
const { randomBytes } = require("crypto");

const generateDocName = () => randomBytes(10).toString("hex");

class FirestoreProvider {

	constructor(serviceAccount) {
			
		this.collectionUser = "process@user"
		this.collectionSensor = "process@sensor";
		this.collectionCompany = "process@company";
		this.collectionMachine = "process@machine";

		const props = Object.keys(serviceAccount);
		if (
			!props.includes("projectId") ||
			!props.includes("clientEmail") ||
			!props.includes("privateKey")
		) throw new Error("Credenciais mal formatadas");

		try {
			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount),
			});
			this.db = admin.firestore();
		} catch (err) {
			throw new Error(`Problema ao conectar no banco de dados: ${err.message}`);
		}
	}

	async index() {
		const snapshot = await this.db.collection(this.collectionCompany).get();
		return snapshot.docs.map(doc => doc.data());
	}

	async getCompany(company) {
		const hasCompany = await this.db
			.collection(this.collectionCompany)
			.where("name", "==", company)
			.get(); 

		return hasCompany;
	}

	async getUsersCompany(company) {
		const hasCompany = await this.db
			.collection(this.collectionCompany)
			.where("name", "==", company)
			.get(); 

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const users = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionUser)
			.get();
		
		return users.docs.map(user => user.data());
	}

	async getMachinesCompany(company) {
		const hasCompany = await this.db
			.collection(this.collectionCompany)
			.where("name", "==", company)
			.get(); 

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const users = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.get();
		
		return users.docs.map(user => user.data());
	}

	async save(data) {
		if (!data.name)
			throw new Error("Propriedade 'name' é necessária");
		
		const hasCompany = await this.getCompany(data.name);
		if (!hasCompany.empty)
			throw new Error("Empresa já cadastrada");

		const document = this.db
			.collection(this.collectionCompany)
			.doc(generateDocName());

		return await document.set({ 
			...data,
			id: uuidv4(),
		});
	}

	async findById(id) {
		const document = await this.db
			.collection(this.collectionCompany)
			.where("id", "==", id)
			.get();

		return document.empty ? null : document.docs[0].data();
	}

	async remove(id) {
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

	async createUser(company, data) {
		const hasCompany = await this.getCompany(company);
		
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

	async updateUser(company, id, data) {
		const hasCompany = await this.getCompany(company);
		
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

	async createMachine(company, data) {
		const hasCompany = await this.getCompany(company);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
				
		const document = this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.doc(generateDocName());

		return await document.set({ 
			...data,
			id: uuidv4(),
		});
	}

	async updateMachine(company, id, data) {
		const hasCompany = await this.getCompany(company);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
		
		const document = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
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

module.exports = FirestoreProvider;