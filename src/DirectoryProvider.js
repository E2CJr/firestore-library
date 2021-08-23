const { generateDocName, getPath } = require("./common/commons");
const CompanyProvider = require("./CompanyProvider.js");
const FirestoreConnection = require("./connection/FirestoreConnection");


class DirectoryProvider extends FirestoreConnection {

  constructor(serviceAccount) {
    super(serviceAccount);
    this.companyProvider = new CompanyProvider(serviceAccount);
  }
  
  async index(company, level) {
		const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const directories = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionDirectory)
			.where("level", "in", [level, level+1])
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
		
  async initTree(company) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não encontrada");

		const document = hasCompany.docs[0].ref
			.collection(this.collectionDirectory)
			.doc(generateDocName());

		await this.startDirectoryCounter(hasCompany.docs[0].ref);

		await document.set({
			path: "/",
			level: 0,
			label: "Fábrica",
			id: await this.generateDirectoryIndex(hasCompany.docs[0].ref),
		});
  }

	async createFolder(company, parent, label) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não encontrada");
	
		const document = hasCompany.docs[0].ref
			.collection(this.collectionDirectory)
			.doc(generateDocName());

		const hasParent = await this.getById(company, parent, true);
		if (hasParent.empty) 
			throw new Error("Diretório pai não encontrado");

		await document.set({
			label,
			parent,
			content: {
				clps: [],
				sensors: [],
				machines: [],
			},
			level: hasParent.docs[0].data().level + 1,
			path: `${hasParent.docs[0].data().path}${getPath(label)}/`,
			id: await this.generateDirectoryIndex(hasCompany.docs[0].ref),
		});
	}

	async updateFolder(company, folder, label) {
		const hasFolder = await this.getById(company, folder, true);
		
		if (hasFolder.empty) 
			throw new Error("Pasta não encontrada");
		
		const oldPath = hasFolder.docs[0].data().path;
		const newPath = oldPath.replace(getPath(oldPath), getPath(label));

		await hasFolder.docs[0].ref.update({
			label,
			path: newPath
		});
	}

	async deleteFolder(company, folder) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
						
		const document = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionDirectory)
			.where("id", "==", folder)
			.get();

		if (document.empty) 
			throw new Error("ID não encontrado");

		await document.docs[0].ref.delete();
	}

	async addEntities(company, folder, data) {
		const document = await this.getById(company, folder, true);
		
		if (document.empty) 
			throw new Error("Pasta não encontrada");

		const folderData = document.docs[0].data();

		await document.docs[0].ref.update({
			content: {
				clps: [
					...folderData.content?.clps,
					...data.clps
				],
				sensors: [
					...folderData.content?.sensors,
					...data.sensors
				],
				machines: [
					...folderData.content?.machines,
					...data.machines
				],
			},
			id: folderData.id,
		});
	}
}

module.exports = DirectoryProvider;