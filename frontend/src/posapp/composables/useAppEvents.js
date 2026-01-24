import { markSourceLoaded, setSourceProgress } from "../utils/loading.js";
import { isManualOffline } from "../../offline/index.js";
import { checkNetworkConnectivity } from "./useNetwork.js";

/* global frappe */

export function useAppEvents(eventBus, appStore, context) {
	if (!eventBus) return;

	// Listen for POS profile registration
	eventBus.on("register_pos_profile", (data) => {
		appStore.setPosProfile(data.pos_profile || {});
		if (navigator.onLine && context.refreshTaxInclusiveSetting) {
			context.refreshTaxInclusiveSetting();
		}
	});

	// Track last submitted invoice id
	eventBus.on("set_last_invoice", (invoiceId) => {
		appStore.setLastInvoiceId(invoiceId);
	});

	eventBus.on("data-loaded", (name) => {
		markSourceLoaded(name);
	});
	eventBus.on("data-load-progress", ({ name, progress }) => {
		setSourceProgress(name, progress);
	});

	// Allow other components to trigger printing
	eventBus.on("print_last_invoice", () => {
		if (context.handlePrintLastInvoice) context.handlePrintLastInvoice();
	});

	// Manual trigger to sync offline invoices
	eventBus.on("sync_invoices", () => {
		if (context.handleSyncInvoices) context.handleSyncInvoices();
	});

	// Update pending invoice count when other modules emit the change
	eventBus.on("pending_invoices_changed", (count) => {
		appStore.setPendingInvoices(count);
	});

	eventBus.on("open_purchase_orders", () => {
		appStore.setPage("Purchase Order");
	});

	// Enhanced server connection status listeners
	if (typeof frappe !== "undefined" && frappe.realtime) {
		frappe.realtime.on("connect", () => {
			appStore.setServerStatus(true);
			window.serverOnline = true;
			appStore.setServerConnecting(false);
			console.log("Server: Connected via WebSocket");
			context.$forceUpdate && context.$forceUpdate();
		});

		frappe.realtime.on("disconnect", () => {
			appStore.setServerStatus(false);
			window.serverOnline = false;
			appStore.setServerConnecting(false);
			console.log("Server: Disconnected from WebSocket");
			// Trigger connectivity check to verify if it's just WebSocket or full network
			setTimeout(() => {
				if (!isManualOffline()) {
					checkNetworkConnectivity();
				}
			}, 1000);
		});

		frappe.realtime.on("connecting", () => {
			appStore.setServerConnecting(true);
			console.log("Server: Connecting to WebSocket...");
			context.$forceUpdate && context.$forceUpdate();
		});

		frappe.realtime.on("reconnect", () => {
			console.log("Server: Reconnected to WebSocket");
			window.serverOnline = true;
			if (!isManualOffline()) {
				checkNetworkConnectivity();
			}
		});
	}

	// Listen for visibility changes to check connectivity when tab becomes active
	document.addEventListener("visibilitychange", () => {
		if (!document.hidden && navigator.onLine && !isManualOffline()) {
			checkNetworkConnectivity();
		}
	});
}
