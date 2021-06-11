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
			if (!admin.apps.length) {
				admin.initializeApp({
					credential: admin.credential.cert(serviceAccount),
				});
			}
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
			.where("id", "==", company)
			.get(); 

		return hasCompany;
	}

	async getUsersCompany(company) {
		const hasCompany = await this.db
			.collection(this.collectionCompany)
			.where("id", "==", company)
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
	
	async getUserByEmail(company, email) {
		const hasCompany = await this.db
			.collection(this.collectionCompany)
			.where("id", "==", company)
			.get(); 

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

	async findUserByEmail(email) {
		const companies = await this.db
			.collection(this.collectionCompany)
			.get();

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

	async getMachinesCompany(company, id=null) {
		const hasCompany = await this.db
			.collection(this.collectionCompany)
			.where("id", "==", company)
			.get(); 

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const document = this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine);
		
		const machines = id
			? await document.where("id", "==", id).get()
			: await document.get(); 
		
		return machines.docs.map(user => user.data());
	}

	async save(data) {
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

	async updateUserWithoutCompany(id, data) {
		const companies = await this.db
			.collection(this.collectionCompany)
			.get();

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

	async deleteUser(company, id) {
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

		await document.docs[0].ref.delete();
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
			sensorParameters: {
				...data.sensorParameters,
				...document.docs[0].data().sensorParameters
			},
			id: document.docs[0].data().id,
		});
	}

	async deleteMachine(company, id) {
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

		await document.docs[0].ref.delete();
	}

	async getMachineBySensor(company, sensorId) {
		const hasCompany = await this.getCompany(company);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
		
		const document = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.get();

		for (let i=0 ; i<document.docs.length ; i++) {
			const machine = document.docs[i].data();
			const sensors = await this.getSensors(company, machine.id);
			if (sensors.length === 0) continue;

			for (let j=0 ; j<sensors.length ; j++) 
				if (sensors[i].id === sensorId) return machine;
		}
		return null;
	}

	async getSensors(company, machineId, returnInfos=false, returnEvents=false) {
		const hasCompany = await this.getCompany(company);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
				
		const hasMachine = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.where("id", "==", machineId)
			.get();

		if (hasMachine.empty) 
			throw new Error("Máquina não cadastrada");
		
		const sensors = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.doc(hasMachine.docs[0].ref.path.split('/')[3])
			.collection(this.collectionSensor)
			.get();
		
		return sensors.docs.map(sensor => {
			if (returnInfos && returnEvents) return sensor.data();

			if (returnInfos) {
				const { events: _, ...rest } = sensor.data();
				return rest;
			}

			if (returnEvents) {
				const { infos: _, ...rest } = sensor.data();
				return rest;
			}

			const { infos: _, events: __, ...rest } = sensor.data();
			return rest;
		});
	}

	async getSensorsById(company, machineId, id) {
		const hasCompany = await this.getCompany(company);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
				
		const hasMachine = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.where("id", "==", machineId)
			.get();

		if (hasMachine.empty) 
			throw new Error("Máquina não cadastrada");
		
		const sensors = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.doc(hasMachine.docs[0].ref.path.split('/')[3])
			.collection(this.collectionSensor)
			.where("id", "==", id)
			.get();
		
		return sensors.empty? null : sensors.docs[0].data();
	}

	async createSensor(company, machineId, data) {
		const hasCompany = await this.getCompany(company);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
				
		const hasMachine = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.where("id", "==", machineId)
			.get();

		if (hasMachine.empty) 
			throw new Error("Máquina não cadastrada");
		
		const document = this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.doc(hasMachine.docs[0].ref.path.split('/')[3])
			.collection(this.collectionSensor)
			.doc(generateDocName());

		return await document.set({ 
			...data,
			id: uuidv4(),
		});
	}

	async getSensor(company, machineId, id) {
		const hasCompany = await this.getCompany(company);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
				
		const hasMachine = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.where("id", "==", machineId)
			.get();

		if (hasMachine.empty) 
			throw new Error("Máquina não cadastrada");
		
		const document = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.doc(hasMachine.docs[0].ref.path.split('/')[3])
			.collection(this.collectionSensor)
			.where("id", "==", id)
			.get();
		
		return document.empty? null : document.docs[0];
	}

	async updateSensor(company, machineId, id, data) {
		const sensor = await this.getSensor(company, machineId, id);
		
		if (!sensor)
			throw new Error("ID não encontrado");

		await sensor.ref.update({
			...data,
			id: sensor.data().id,
		});
	}

	async saveSensorInfos(company, machineId, id, data) {
		const sensor = await this.getSensor(company, machineId, id);

		if (!sensor)
			throw new Error("ID não encontrado");

		const date = new Date().toISOString().split('T')[0];
		const [ano, mes, dia] = date.split('-');

		const sensorData = sensor.data();

		sensorData.infos = {
			...sensorData.infos,
			[`${ano}`]: {
				...sensorData.infos?.[ano],
				[`${mes}`]: {
					...sensorData.infos?.[ano]?.[mes],
					[`${dia}`]: [
						...sensorData.infos?.[ano]?.[mes]?.[dia]
							? sensorData.infos?.[ano]?.[mes]?.[dia] 
							: [],
						{ ...data }
					]
				}
			}
		}

		await sensor.ref.update({
			...sensorData
		});
	}

	async deleteSensor(company, machineId, id) {
		const hasCompany = await this.getCompany(company);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
				
		const hasMachine = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.where("id", "==", machineId)
			.get();

		if (hasMachine.empty) 
			throw new Error("Máquina não cadastrada");
		
		const document = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.doc(hasMachine.docs[0].ref.path.split('/')[3])
			.collection(this.collectionSensor)
			.where("id", "==", id)
			.get();

		if (document.empty) 
			throw new Error("ID não encontrado");

		await document.docs[0].ref.delete();
	}
	
	async saveLog(company, log) {
		const hasCompany = await this.getCompany(company);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");

		const now = new Date();
		now.setHours(now.getHours() - now.getTimezoneOffset() / 60);
		const [date, hour] = now.toISOString().split('T');
		const [ano, mes, dia] = date.split('-');
		
		const companyData = hasCompany.docs[0].data();

		companyData.logs = {
			...companyData.logs,
			[`${ano}`]: {
				...companyData.logs?.[ano],
				[`${mes}`]: {
					...companyData.logs?.[ano]?.[mes],
					[`${dia}`]: [
						...companyData.logs?.[ano]?.[mes]?.[dia]
							? companyData.logs?.[ano]?.[mes]?.[dia] 
							: [],
						`${hour.split('.')[0]} - ${log}`
					]
				}
			}
		}

		await hasCompany.docs[0].ref.update({
			...companyData
		});	
	}

	async getLogs(company) {
		const hasCompany = await this.getCompany(company);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");

		return hasCompany.docs[0].data().logs;		
	}
	
	async saveEvents(company, machineId, id, ...evs) {
		const sensor = await this.getSensor(company, machineId, id);
		
		if (!sensor)
			throw new Error("ID não encontrado");

		const now = new Date();
		now.setHours(now.getHours() - now.getTimezoneOffset() / 60);
		const [date, hour] = now.toISOString().split('T');
		const [ano, mes, dia] = date.split('-');
		
		const sensorData = sensor.data();

		sensorData.events = {
			...sensorData.events,
			[`${ano}`]: {
				...sensorData.events?.[ano],
				[`${mes}`]: {
					...sensorData.events?.[ano]?.[mes],
					[`${dia}`]: [
						...sensorData.events?.[ano]?.[mes]?.[dia]
							? sensorData.events?.[ano]?.[mes]?.[dia] 
							: [],
						...evs.map(event => `${hour.split('.')[0]} - ${event}`)
					]
				}
			}
		}

		await sensor.ref.update({
			...sensorData
		});	
	}
	
}

module.exports = FirestoreProvider;