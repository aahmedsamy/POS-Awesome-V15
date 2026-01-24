import { defineStore } from "pinia";
import { ref } from "vue";
import {
	getOpeningStorage,
	getCacheUsageEstimate,
	checkDbHealth,
	queueHealthCheck,
	purgeOldQueueEntries,
	initPromise,
	memoryInitPromise,
	isManualOffline,
	getPendingOfflineInvoiceCount,
	getLastSyncTotals,
} from "../../offline/index.js";
import { markSourceLoaded } from "../utils/loading.js";

export const useAppStore = defineStore("app", () => {
	// Network & Server Status
	const networkOnline = ref(navigator.onLine || false);
	const serverOnline = ref(false);
	const serverConnecting = ref(false);
	const isIpHost = ref(false);
	const manualOffline = ref(false);

	// Page Navigation
	const currentPage = ref("POS");

	// Cache & Storage Stats
	const cacheUsage = ref(0);
	const cacheUsageDetails = ref({ total: 0, indexedDB: 0, localStorage: 0 });
	const cacheUsageLoading = ref(false);

	// App Data
	const posProfile = ref({});
	const pendingInvoices = ref(0);
	const lastInvoiceId = ref("");
	const syncTotals = ref({ pending: 0, synced: 0, drafted: 0 });

	// Actions
	function setNetworkStatus(status) {
		networkOnline.value = status;
	}

	function setServerStatus(status) {
		serverOnline.value = status;
	}

	function setServerConnecting(status) {
		serverConnecting.value = status;
	}

	function setManualOffline(status) {
		manualOffline.value = status;
	}

	function setPage(page) {
		currentPage.value = page;
	}

	function setPosProfile(profile) {
		posProfile.value = profile || {};
	}

	function setPendingInvoices(count) {
		pendingInvoices.value = count;
	}

	function setLastInvoiceId(id) {
		lastInvoiceId.value = id;
	}

	function setSyncTotals(totals) {
		syncTotals.value = totals;
	}

	async function initializeData() {
		await initPromise;
		await memoryInitPromise;
		checkDbHealth().catch(() => {});

		// Load POS profile from cache or storage
		const openingData = getOpeningStorage();
		if (openingData && openingData.pos_profile) {
			posProfile.value = openingData.pos_profile;
			// Note: refreshTaxInclusiveSetting call is moved out or called here if we import frappe
			// keeping it simple for now, Home.vue can still call it or we move it here later
		}

		if (queueHealthCheck()) {
			alert("Offline queue is too large. Old entries will be purged.");
			purgeOldQueueEntries();
		}

		pendingInvoices.value = getPendingOfflineInvoiceCount();
		syncTotals.value = getLastSyncTotals();

		getCacheUsageEstimate()
			.then((usage) => {
				cacheUsage.value = usage.percentage || 0;
				cacheUsageDetails.value = {
					total: usage.total || 0,
					indexedDB: usage.indexedDB || 0,
					localStorage: usage.localStorage || 0,
				};
				if (usage.percentage > 90) {
					alert("Local cache nearing capacity. Consider going online to sync.");
				}
			})
			.catch(() => {});

		// Check if running on IP host
		isIpHost.value = /^\d+\.\d+\.\d+\.\d+/.test(window.location.hostname);

		// Initialize manual offline state
		manualOffline.value = isManualOffline();
		if (manualOffline.value) {
			networkOnline.value = false;
			serverOnline.value = false;
			window.serverOnline = false;
		}

		markSourceLoaded("init");
	}

	return {
		networkOnline,
		serverOnline,
		serverConnecting,
		isIpHost,
		manualOffline,
		currentPage,
		cacheUsage,
		cacheUsageDetails,
		cacheUsageLoading,
		posProfile,
		pendingInvoices,
		lastInvoiceId,
		syncTotals,
		setNetworkStatus,
		setServerStatus,
		setServerConnecting,
		setManualOffline,
		setPage,
		setPosProfile,
		setPendingInvoices,
		setLastInvoiceId,
		setSyncTotals,
		initializeData,
	};
});
