const admin = require("firebase-admin");

class FirestoreConnection {

  constructor(serviceAccount) {
			
		this.collectionUser = "process@user"
		this.collectionSensor = "process@sensor";
		this.collectionCompany = "process@company";
		this.collectionMachine = "process@machine";
		this.collectionSensorInfos = "process@sensor_infos";

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
  
}

module.exports = FirestoreConnection;