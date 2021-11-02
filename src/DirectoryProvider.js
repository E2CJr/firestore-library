const { generateDocName, getPath } = require("./common/commons");
const CompanyProvider = require("./CompanyProvider.js");
const FirestoreConnection = require("./connection/FirestoreConnection");


class DirectoryProvider extends FirestoreConnection {

  constructor(serviceAccount) {
    super(serviceAccount);
    this.companyProvider = new CompanyProvider(serviceAccount);
  }
  
  async index(company, level, folder) {
		const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
		
		const document = this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionDirectory);
	
		const directories = await document
			.where("level", "in", [level, level+1])
      .get();

		if (directories.empty) return null;

		const directoriesData = directories.docs.map(doc => doc.data());
		const [ directoryFolder ] = directoriesData.filter(item => item.id === folder);

		const parent = await document
			.where("id", "==", directoryFolder?.parent || '')
      .get();
				
		return {
			parent: parent.empty ? {} : parent.docs[0].data(),
			list: directoriesData,
		}
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

		const data = {
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
		};

		await document.set(data);
		return data;
	}

	async updateFolder(company, folder, label) {
		const hasFolder = await this.getById(company, folder, true);
		
		if (hasFolder.empty) 
			throw new Error("Pasta não encontrada");
		
		const data = hasFolder.docs[0].data();
		const newPath = data.path.replace(getPath(data.label), getPath(label));

		await hasFolder.docs[0].ref.update({
			label,
			path: newPath
		});

		return {
			...data,
			label,
			path: newPath,
		}
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