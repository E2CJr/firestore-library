const { v4:uuidv4 } = require("uuid");
const CompanyProvider = require("./CompanyProvider.js");
const MachineProvider = require("./MachineProvider");
const FirestoreConnection = require("./connection/FirestoreConnection");
const { generateDocName, getEndDate, getStartDate } = require("./common/commons");


class SensorProvider extends FirestoreConnection {
  
  constructor(serviceAccount) {
		super(serviceAccount);
		this.companyProvider = new CompanyProvider(serviceAccount);
    this.machineProvider = new MachineProvider(serviceAccount);
  }

  async index(company, pagination = { limit: 10, page: 0 }) {
		const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const doc = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionSensor)
			.orderBy("createdAt", "desc");
		
		const sensors = await doc
			.offset(pagination.limit * pagination.page)
			.limit(pagination.limit)
      .get();
			
		const count = (await doc.get()).size;
			
		return {
			count,
			list: sensors.docs.map(sensor => sensor.data()),
		};
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
				
		return sensor.docs[0].data();
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

		const save = {
			...data,
			machineId,
			id: uuidv4(),
		};

		await document.set(save);
		return save;
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

	async inArray(company, list) {
    const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const sensors = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionSensor)
      .where("id", "in", list)
      .get();
				
		return sensors.empty? [] : sensors.docs.map(doc => doc.data().id); 
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
			configs: {
				...sensorData.configs,
				...data,
			}
		});
	}

	async getInfos(company, id, start, end) {
		const sensor = await this.getById(company, id, true);
		
		if (sensor.empty) 
			throw new Error("ID não encontrado");
			
		if (!end) end = getEndDate();
		if (!start) start = getStartDate();
		
		const document = await sensor.docs[0].ref
			.collection(this.collectionSensorInfos)
			.orderBy("timestamp")
			.startAt(start)
			.endAt(end)
			.select('timestamp', 'sensorId', 'rpm', 'temperature', 'rmsVibrationMms')
			.get();
			
		if (document.empty) return [];
			
		const last = await sensor.docs[0].ref
			.collection(this.collectionSensorInfos)
			.orderBy("timestamp", "desc")
			.startAt(end)
			.limit(1)
			.select('timestamp', 'sensorId', 'vibrationFd', 'vibrationFbin', 'timeSignal')
			.get();
		
		return {
			list: document.docs.map(doc => doc.data()),
			last: last.empty? [] : last.docs[0].data()
		};
	}

	async getRmsVibration(company, id, start, end) {
		const sensor = await this.getById(company, id, true);
		
		if (sensor.empty) 
			throw new Error("ID não encontrado");
						
		const document = await sensor.docs[0].ref
			.collection(this.collectionSensorInfos)
			.orderBy("timestamp")
			.startAt(start)
			.endAt(end)
			.select("rmsVibrationMms")
			.get();
			
		return document.empty? [] : document.docs.map(doc => {
			const { x, y, z } = doc.data().rmsVibrationMms;
			return { x, y, z };
		});
	}

	async saveInfos(company, id, data) {
		const sensor = await this.getById(company, id, true);
		
		if (sensor.empty) 
			throw new Error("ID não encontrado");

		const document = sensor.docs[0].ref
			.collection(this.collectionSensorInfos)
			.doc(generateDocName());
		
		const now = new Date();
		now.setHours(now.getHours() - now.getTimezoneOffset() / 60);
		
		const { timestamp: _, ...rest } = data;
		return await document.set({ 
			...rest,
			timestamp: Number(data.timestamp) || now.getTime(),
		});
	}

}

module.exports = SensorProvider;