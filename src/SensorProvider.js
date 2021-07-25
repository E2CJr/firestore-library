const { v4:uuidv4 } = require("uuid");
const CompanyProvider = require("./CompanyProvider.js");
const MachineProvider = require("./MachineProvider");
const FirestoreProvider = require("./FirestoreProvider");
const { generateDocName } = require("./common/commons");


class SensorProvider extends FirestoreProvider {
  
  constructor(serviceAccount) {
		super(serviceAccount);
		this.companyProvider = new CompanyProvider(serviceAccount);
    this.machineProvider = new MachineProvider(serviceAccount);
  }

  async index(company) {
		const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const sensors = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionSensor)
      .get();
				
		return sensors.docs.map(sensor => sensor.data());
	}

  async getById(company, id, ref=false) {
    const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const sensor = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionSensor)
      .where("id", "==", id)
      .get();

		if (ref) return sensor;
				
		return sensor.empty ? null : sensor.docs[0].data();
  }

  async save(company, machineId, data) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
				
		const hasMachine = await this.machineProvider.getById(company, machineId, true);

		if (hasMachine.empty) 
			throw new Error("Máquina não cadastrada");
		
		const document = this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionSensor)
			.doc(generateDocName());

		return await document.set({ 
			...data,
      machineId,
			id: uuidv4(),
		});
	}

  async update(company, id, data) {
		const sensor = await this.getById(company, id, true);
		
		if (sensor.empty)
			throw new Error("ID não encontrado");

		await sensor.docs[0].ref.update({
			...data,
			id: sensor.docs[0].data().id,
      machineId: sensor.docs[0].data().machineId,
		});
	}

  async delete(company, id) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
						
		const document = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionSensor)
			.where("id", "==", id)
			.get();

		if (document.empty) 
			throw new Error("ID não encontrado");

		await document.docs[0].ref.delete();
	}

}

module.exports = SensorProvider;