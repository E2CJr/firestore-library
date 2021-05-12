const { v4:uuidv4 } = require("uuid");
const admin = require("firebase-admin");
const { randomBytes } = require("crypto");

const generateDocName = () => randomBytes(10).toString("hex");

class FirestoreProvider {

	constructor(serviceAccount) {
			
		this.collection = "process@company";

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
		const snapshot = await this.db.collection(this.collection).get();
		return snapshot.docs.map(doc => doc.data());
	}

	async getCompany(company) {
		const hasCompany = await this.db
			.collection(this.collection)
			.where("name", "==", company)
			.get(); 

		return hasCompany;
	}

	async save(data) {
		if (!data.name)
			throw new Error("name is required");
		
		const hasCompany = await this.getCompany(data.name);
		if (!hasCompany.empty)
			throw new Error("Company already exists");

		const document = this.db
			.collection(this.collection)
			.doc(generateDocName());

		return await document.set({ 
			...data,
			id: uuidv4(),
		});
	}

	async findById(id) {
		const document = await this.db
			.collection(this.collection)
			.where("id", "==", id)
			.get();

		return document.empty ? null : document.docs[0].data();
	}

	async remove(id) {
		const document = await this.db
			.collection(this.collection)
			.where("id", "==", id)
			.get();

		if (document.empty) 
			throw new Error("ID não encontrado");

		await document.docs[0].ref.delete();
	}

	async update(id, data) {
		const document = await this.db
			.collection(this.collection)
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