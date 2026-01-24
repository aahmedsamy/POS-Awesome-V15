<template>
	<v-app class="container1" :class="rtlClasses">
		<AppLoadingOverlay :visible="globalLoading" />
		<UpdatePrompt />
		<v-main class="main-content">
			<ClosingDialog />
			<Navbar
				:pos-profile="posProfile"
				:pending-invoices="pendingInvoices"
				:last-invoice-id="lastInvoiceId"
				:network-online="networkOnline"
				:server-online="serverOnline"
				:server-connecting="serverConnecting"
				:is-ip-host="isIpHost"
				:sync-totals="syncTotals"
				:manual-offline="manualOffline"
				:cache-usage="cacheUsage"
				:cache-usage-loading="cacheUsageLoading"
				:cache-usage-details="cacheUsageDetails"
				:loading-progress="loadingProgress"
				:loading-active="loadingActive"
				:loading-message="loadingMessage"
				@change-page="setPage($event)"
				@nav-click="handleNavClick"
				@close-shift="handleCloseShift"
				@print-last-invoice="handlePrintLastInvoice"
				@sync-invoices="handleSyncInvoices"
				@toggle-offline="handleToggleOffline"
				@toggle-theme="handleToggleTheme"
				@logout="handleLogout"
				@refresh-cache-usage="handleRefreshCacheUsage"
				@update-after-delete="handleUpdateAfterDelete"
			/>
			<div class="page-content">
				<component v-bind:is="page" class="mx-4 md-4"></component>
			</div>
		</v-main>
	</v-app>
</template>

<script>
/* global frappe, $ */
import Navbar from "./components/Navbar.vue";
import POS from "./components/pos/Pos.vue";
import Payments from "./components/payments/Pay.vue";
import PurchaseOrders from "./components/pos/PurchaseOrders.vue";
import BarcodePrinting from "./components/pos/BarcodePrinting.vue";
import ClosingDialog from "./components/pos/ClosingDialog.vue";
import AppLoadingOverlay from "./components/ui/LoadingOverlay.vue";
import UpdatePrompt from "./components/ui/UpdatePrompt.vue";
import { useLoading } from "./composables/useLoading.js";
import { usePosShift } from "./composables/usePosShift.js";
import { loadingState, initLoadingSources, setSourceProgress, markSourceLoaded } from "./utils/loading.js";
import { useCustomersStore } from "./stores/customersStore.js";
import { useAppStore } from "./stores/appStore.js";
import { storeToRefs } from "pinia";
import {
	getOpeningStorage,
	getCacheUsageEstimate,
	checkDbHealth,
	queueHealthCheck,
	purgeOldQueueEntries,
	initPromise,
	memoryInitPromise,
	toggleManualOffline,
	isManualOffline,
	syncOfflineInvoices,
	getPendingOfflineInvoiceCount,
	isOffline,
	getLastSyncTotals,
} from "../offline/index.js";
import {
	appendDebugPrintParam,
	isDebugPrintEnabled,
	silentPrint,
	watchPrintWindow,
} from "./plugins/print.js";
import {
	setupNetworkListeners,
	checkNetworkConnectivity,
	detectHostType,
	performConnectivityChecks,
	checkFrappePing,
	checkCurrentOrigin,
	checkExternalConnectivity,
	checkWebSocketConnectivity,
} from "./composables/useNetwork.js";
import { useAppEvents } from "./composables/useAppEvents.js";
import { useRtl } from "./composables/useRtl.js";

export default {
	setup() {
		const { isRtl, rtlStyles, rtlClasses } = useRtl();
		const { overlayVisible } = useLoading();
		const { get_closing_data } = usePosShift();

		const appStore = useAppStore();
		const {
			networkOnline,
			serverOnline,
			serverConnecting,
			isIpHost,
			manualOffline,
			syncTotals,
			cacheUsage,
			cacheUsageDetails,
			cacheUsageLoading,
			currentPage: page,
			posProfile,
			pendingInvoices,
			lastInvoiceId,
		} = storeToRefs(appStore);

		return {
			isRtl,
			rtlStyles,
			rtlClasses,
			globalLoading: overlayVisible,
			get_closing_data,
			appStore,
			// Expose state for template and Options API
			networkOnline,
			serverOnline,
			serverConnecting,
			isIpHost,
			manualOffline,
			syncTotals,
			cacheUsage,
			cacheUsageDetails,
			cacheUsageLoading,
			page,
			posProfile,
			pendingInvoices,
			lastInvoiceId,
		};
	},
	data: function () {
		return {
			// Local UI state not worth moving to store yet
		};
	},
	data: function () {
		return {
			// POS Profile data
			posProfile: {},
			pendingInvoices: 0,
			lastInvoiceId: "",

			// Loading progress handled via utility
		};
	},
	computed: {
		isDark() {
			return this.$theme?.isDark || false;
		},
		loadingProgress() {
			return loadingState.progress;
		},
		loadingActive() {
			return loadingState.active;
		},
		loadingMessage() {
			return loadingState.message;
		},
	},
	watch: {
		networkOnline(newVal, oldVal) {
			if (newVal && !oldVal) {
				this.refreshTaxInclusiveSetting();
				this.eventBus.emit("network-online");
				this.handleSyncInvoices();
			}
		},
		serverOnline(newVal, oldVal) {
			if (newVal && !oldVal) {
				this.eventBus.emit("server-online");
				this.handleSyncInvoices();
			}
		},
	},
	components: {
		Navbar,
		POS,
		Payments,
		"Purchase Order": PurchaseOrders,
		"Barcode Printing": BarcodePrinting,
		ClosingDialog,
		AppLoadingOverlay,
		UpdatePrompt,
	},
	mounted() {
		this.remove_frappe_nav();
		this.adjust_frappe_sidebar_offset();
		window.addEventListener("resize", this.adjust_frappe_sidebar_offset);
		initLoadingSources(["init", "items", "customers"]);
		this.initializeData();
		this.setupNetworkListeners();
		useAppEvents(this.eventBus, this.appStore, this);
		this.handleRefreshCacheUsage();
		const customersStore = useCustomersStore();
		const { loadProgress, customersLoaded } = storeToRefs(customersStore);
		this.$watch(
			() => loadProgress.value,
			(progress) => {
				setSourceProgress("customers", progress);
			},
			{ immediate: true },
		);
		this.$watch(
			() => customersLoaded.value,
			(loaded) => {
				if (loaded) {
					markSourceLoaded("customers");
				}
			},
			{ immediate: true },
		);
	},
	methods: {
		setupNetworkListeners,
		checkNetworkConnectivity,
		detectHostType,
		performConnectivityChecks,
		checkFrappePing,
		checkCurrentOrigin,
		checkExternalConnectivity,
		checkWebSocketConnectivity,
		setPage(page) {
			this.page = page;
		},

		async initializeData() {
			await this.appStore.initializeData();

			// Post-init checks that rely on Frappe/UI context
			if (this.posProfile && this.posProfile.name && navigator.onLine) {
				await this.refreshTaxInclusiveSetting();
			}
		},

		// Event handlers for navbar events
		handleNavClick() {
			// Handle navigation click
		},

		handleCloseShift() {
			this.get_closing_data();
		},

		handlePrintLastInvoice() {
			if (!this.lastInvoiceId) {
				return;
			}

			const print_format = this.posProfile.print_format_for_online || this.posProfile.print_format;
			const letter_head = this.posProfile.letter_head || 0;
			const doctype = this.posProfile.create_pos_invoice_instead_of_sales_invoice
				? "POS Invoice"
				: "Sales Invoice";
			const debugPrint = isDebugPrintEnabled();
			let url =
				frappe.urllib.get_base_url() +
				"/printview?doctype=" +
				encodeURIComponent(doctype) +
				"&name=" +
				this.lastInvoiceId +
				"&trigger_print=1" +
				"&format=" +
				print_format +
				"&no_letterhead=" +
				letter_head;

			url = appendDebugPrintParam(url, debugPrint);
			const printOptions = {
				allowOfflineFallback: isOffline(),
				triggerPrint: "1",
				debugPrint,
				debugInfo: {
					printFormat: print_format,
					templatePath: "online-printview",
				},
			};
			if (this.posProfile.posa_silent_print) {
				silentPrint(url, printOptions);
			} else {
				const printWindow = window.open(url, "Print");
				watchPrintWindow(printWindow, printOptions);
			}
		},

		async handleSyncInvoices() {
			const pending = getPendingOfflineInvoiceCount();
			if (pending) {
				this.eventBus.emit("show_message", {
					title: `${pending} invoice${pending > 1 ? "s" : ""} pending for sync`,
					color: "warning",
				});
			}
			if (isOffline()) {
				return;
			}
			const result = await syncOfflineInvoices();
			if (result && (result.synced || result.drafted)) {
				if (result.synced) {
					this.eventBus.emit("show_message", {
						title: `${result.synced} offline invoice${result.synced > 1 ? "s" : ""} synced`,
						color: "success",
					});
				}
				if (result.drafted) {
					this.eventBus.emit("show_message", {
						title: `${result.drafted} offline invoice${result.drafted > 1 ? "s" : ""} saved as draft`,
						color: "warning",
					});
				}
			}
			this.appStore.setPendingInvoices(getPendingOfflineInvoiceCount());
			if (result) {
				this.appStore.setSyncTotals(result);
			}
		},

		handleToggleOffline() {
			toggleManualOffline();
			const status = isManualOffline();
			this.appStore.setManualOffline(status);
			if (status) {
				this.appStore.setNetworkStatus(false);
				this.appStore.setServerStatus(false);
				window.serverOnline = false;
			} else {
				this.checkNetworkConnectivity();
			}
		},

		handleToggleTheme() {
			// Use the global theme plugin instead of local state
			this.$theme.toggle();
		},

		handleLogout() {
			frappe.call("logout").finally(() => {
				window.location.href = "/app";
			});
		},

		handleRefreshCacheUsage() {
			this.appStore.cacheUsageLoading = true;
			getCacheUsageEstimate()
				.then((usage) => {
					this.appStore.cacheUsage = usage.percentage || 0;
					this.appStore.cacheUsageDetails = {
						total: usage.total || 0,
						indexedDB: usage.indexedDB || 0,
						localStorage: usage.localStorage || 0,
					};
				})
				.catch((e) => {
					console.error("Failed to refresh cache usage", e);
				})
				.finally(() => {
					this.appStore.cacheUsageLoading = false;
				});
		},

		async refreshTaxInclusiveSetting() {
			if (!this.posProfile || !this.posProfile.name || !navigator.onLine) {
				return;
			}
			try {
				const r = await frappe.call({
					method: "posawesome.posawesome.api.utilities.get_pos_profile_tax_inclusive",
					args: {
						pos_profile: this.posProfile.name,
					},
				});
				if (r.message !== undefined) {
					const val = r.message;
					try {
						localStorage.setItem("posa_tax_inclusive", JSON.stringify(val));
					} catch (err) {
						console.warn("Failed to cache tax inclusive setting", err);
					}
					import("../offline/index.js")
						.then((m) => {
							if (m && m.setTaxInclusiveSetting) {
								m.setTaxInclusiveSetting(val);
							}
						})
						.catch(() => {});
				}
			} catch (e) {
				console.warn("Failed to refresh tax inclusive setting", e);
			}
		},

		handleUpdateAfterDelete() {
			// Handle update after delete
		},

		remove_frappe_nav() {
			this.$nextTick(() => {
				$(".page-head").remove();
				$(".navbar.navbar-default.navbar-fixed-top").remove();
				this.adjust_frappe_sidebar_offset();
			});
		},
		adjust_frappe_sidebar_offset() {
			const sidebar = document.querySelector(
				".desk-sidebar, .app-sidebar, .sidebar, .side-section, .layout-side-section",
			);
			let sidebarWidth = 0;
			if (sidebar) {
				const sidebarStyles = window.getComputedStyle(sidebar);
				const rect = sidebar.getBoundingClientRect();
				if (sidebarStyles.display !== "none" && rect.width > 0) {
					sidebarWidth = rect.width;
				}
			}
			document.documentElement.style.setProperty("--posa-desk-sidebar-width", `${sidebarWidth}px`);
		},
	},
	beforeUnmount() {
		if (this.eventBus) {
			this.eventBus.off("pending_invoices_changed");
			this.eventBus.off("data-loaded");
		}
		window.removeEventListener("resize", this.adjust_frappe_sidebar_offset);
	},
	created: function () {
		setTimeout(() => {
			this.remove_frappe_nav();
		}, 1000);
	},
};
</script>

<style scoped>
.container1 {
	/* Use dynamic viewport units for better mobile support */
	height: 100dvh;
	max-height: 100dvh;
	overflow: hidden;
	padding-inline-start: var(--posa-desk-sidebar-width, 0px);
	box-sizing: border-box;
}

.main-content {
	/* Fill the available height of the container */
	height: 100%;
	display: flex;
	flex-direction: column;
}

.page-content {
	flex: 1;
	overflow-y: auto;
	padding-top: 8px;
}

/* Ensure proper spacing and prevent layout shifts */
:deep(.v-main__wrap) {
	display: flex;
	flex-direction: column;
	min-height: 100%;
	height: 100%;
}
</style>
