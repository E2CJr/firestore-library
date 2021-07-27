const { v4:uuidv4 } = require("uuid");
const CompanyProvider = require("./CompanyProvider.js");
const MachineProvider = require("./MachineProvider");
const FirestoreConnection = require("./connection/FirestoreConnection");
const { generateDocName } = require("./common/commons");


class SensorProvider extends FirestoreConnection {
  
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
				
		return sensors.docs.map(sensor => {
			const { configs:_, events:__, ...rest } = sensor.data();
			return rest;
		});
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

		if (sensor.empty) return null;
				
		const { configs:_, events:__, ...rest } = sensor.docs[0].data();
		return rest;
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

	// infos e config

	async getConfig(company, id) {
		const sensor = await this.getById(company, id, true);
		
		if (sensor.empty) 
			throw new Error("ID não encontrado");

		return sensor.docs[0].data().configs;
	}

	async saveConfig(company, id, data) {		
		const sensor = await this.getById(company, id, true);
		
		if (sensor.empty) 
			throw new Error("ID não encontrado");
		
		const sensorData = sensor.docs[0].data();

		await sensor.docs[0].ref.update({
			configs: [
				...sensorData.configs ? sensorData.configs : [],
				{ [`${new Date().getTime()}`]: data }
			]
		});
	}

	async getInfos(company, id, start, end) {
		const sensor = await this.getById(company, id, true);
		
		if (sensor.empty) 
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
		
		const document = await sensor.docs[0].ref
			.collection(this.collectionSensorInfos)
			.orderBy("id")
			.startAt(start)
			.endAt(end)
			.get();

		return document.empty? [] : document.docs.map(doc => doc.data());
	}

	async saveInfos(company, id, data) {
		const sensor = await this.getById(company, id, true);
		
		if (sensor.empty) 
			throw new Error("ID não encontrado");

		const document = sensor.docs[0].ref
			.collection(this.collectionSensorInfos)
			.doc(generateDocName());

		return await document.set({ 
			...data,
			id: new Date().getTime(),
		});
	}

}

module.exports = SensorProvider;