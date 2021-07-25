const SensorProvider = require("./SensorProvider");
const CompanyProvider = require("./CompanyProvider.js");


class LogsProvider extends CompanyProvider {

  constructor(serviceAccount) {
		super(serviceAccount);
		this.sensorProvider = new SensorProvider(serviceAccount);
  }

  async index(company) {
		const hasCompany = await this.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");

		return hasCompany.docs[0].data().logs;		
	}

  async save(company, log) {
		const hasCompany = await this.getById(company, true);
		
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

	async saveEvents(company, id, ...evs) {
		const sensor = await this.sensorProvider.getById(company, id, true);
		
		if (sensor.empty)
			throw new Error("ID não encontrado");

		const now = new Date();
		now.setHours(now.getHours() - now.getTimezoneOffset() / 60);
		const [date, hour] = now.toISOString().split('T');
		const [ano, mes, dia] = date.split('-');
		
		const sensorData = sensor.docs[0].data();

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

		await sensor.docs[0].ref.update({
			...sensorData
		});	
	}

}

module.exports = LogsProvider;