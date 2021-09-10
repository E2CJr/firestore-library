const admin = require("firebase-admin");
const { generateDocName } = require("../common/commons");

class FirestoreConnection {

  constructor(serviceAccount) {
			
		this.collectionClp = "process@clp";
		this.collectionUser = "process@user"
		this.collectionSensor = "process@sensor";
		this.collectionCompany = "process@company";
		this.collectionMachine = "process@machine";
		this.collectionClpInfos = "process@clp_infos";
		this.collectionDirectory = "process@directory";
		this.collectionCompanyLogs = "process@company_logs";
		this.collectionSensorInfos = "process@sensor_infos";
		this.collectionInternalErrors = "process@internalerrors";
		this.collectionDirectoryCounter = "process@directory_counter";

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

	async startDirectoryCounter(ref) {
		const document = ref
			.collection(this.collectionDirectoryCounter)
			.doc(generateDocName());
		
		await document.set({
			lastIndex: -1
		});
	}

	async generateDirectoryIndex(ref) {
		const document = await ref
			.collection(this.collectionDirectoryCounter)
			.select("lastIndex")
			.get();

		const index = (document.docs[0].data()).lastIndex;

		await document.docs[0].ref.update({
			lastIndex: index + 1
		});

		return index + 1;
	} 
  
}

module.exports = FirestoreConnection;