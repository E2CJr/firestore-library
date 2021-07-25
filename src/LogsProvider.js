const CompanyProvider = require("./CompanyProvider.js");


class MachineProvider extends CompanyProvider {

  constructor(serviceAccount) {
		super(serviceAccount);
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

}

module.exports = MachineProvider;