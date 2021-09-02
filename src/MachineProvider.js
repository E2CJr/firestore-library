const { v4:uuidv4 } = require("uuid");
const CompanyProvider = require("./CompanyProvider.js");
const FirestoreConnection = require("./connection/FirestoreConnection");
const { generateDocName } = require("./common/commons");


class MachineProvider extends FirestoreConnection {

  constructor(serviceAccount) {
		super(serviceAccount);
		this.companyProvider = new CompanyProvider(serviceAccount);
  }

  async index(company) {
		const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const machines = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
      .get();
				
		return machines.docs.map(machine => machine.data());
	}

  async getById(company, id, ref=false) {
    const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const machine = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
      .where("id", "==", id)
      .get();

		if (ref) return machine;
				
		return machine.empty ? null : machine.docs[0].data();
  }

	async inArray(company, list) {
    const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const machines = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
      .where("id", "in", list)
			.where("clpId", "==", null)
      .get();
				
		return machines.empty? [] : machines.docs.map(doc => doc.data().id); 
  }

  async save(company, data) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
				
		const document = this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.doc(generateDocName());
		
		const save = {
			...data,
			id: uuidv4(),
		};

		await document.set(save);
		return save;
	}

  async update(company, id, data) {
		const machine = await this.getById(company, id, true);

		if (machine.empty) 
			throw new Error("ID não encontrado");

		await machine.docs[0].ref.update({
			...data,
			id: machine.docs[0].data().id,
		});
	}

  async delete(company, id) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
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

		await document.docs[0].ref.delete();
	}

}

module.exports = MachineProvider;