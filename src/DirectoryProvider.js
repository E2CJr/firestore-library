const { v4:uuidv4 } = require("uuid");
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
		
		const document = this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionDirectory);
	
		const directories = await document
			.orderBy("name")
      .get();

		return directories.empty? [] : directories.docs.map(doc => doc.data())
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
		
	async save(company, name) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não encontrada");
	
		const document = this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionDirectory)
			.doc(generateDocName());

		const save = {
			name,
			content: {
				clps: [],
				machines: [],
				sensors: [],
			},
			id: uuidv4(),
		};

		await document.set(save);
		return save;
	}

	async update(company, id, data) {
		const hasFolder = await this.getById(company, id, true);
		
		if (hasFolder.empty) 
			throw new Error("Pasta não encontrada");
		
		const update = {
			...data,
			id: hasFolder.docs[0].data().id
		};

		await hasFolder.docs[0].ref.update(update);

		return update;
	}

	async delete(company, id) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
						
		const document = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionDirectory)
			.where("id", "==", id)
			.get();

		if (document.empty) 
			throw new Error("ID não encontrado");

		await document.docs[0].ref.delete();
	}

	async addEntities(company, id, data) {
		const document = await this.getById(company, id, true);
		
		if (document.empty) 
			throw new Error("Pasta não encontrada");

		const folderData = document.docs[0].data();

		await document.docs[0].ref.update({
			content: {
				clps: [
					...folderData.content?.clps,
					...(data.clps || [])
				],
				sensors: [
					...folderData.content?.sensors,
					...(data.sensors || [])
				],
				machines: [
					...folderData.content?.machines,
					...(data.machines || [])
				],
			},
			id: folderData.id,
		});
	}
}

module.exports = DirectoryProvider;