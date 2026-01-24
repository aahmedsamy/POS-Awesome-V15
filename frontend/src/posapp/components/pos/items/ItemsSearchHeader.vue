<template>
	<div class="sticky-header">
		<v-row class="items">
			<v-col class="pb-0">
				<v-text-field
					ref="searchInput"
					density="compact"
					clearable
					autofocus
					variant="solo"
					color="primary"
					:label="frappe._('Search Items')"
					hint="Search by item code, serial number, batch no or barcode"
					hide-details
					v-model="searchInputModel"
					@keydown.esc="onEsc"
					@keydown.enter="onEnter"
					@keydown="onSearchKeydown"
					@click:clear="onClearSearch"
					@input="onSearchInput"
					@paste="onSearchPaste"
					prepend-inner-icon="mdi-magnify"
					@focus="onSearchFocus"
				>
					<template v-slot:append-inner>
						<v-btn
							v-if="posProfile.posa_enable_camera_scanning"
							icon="mdi-camera"
							size="small"
							color="primary"
							variant="text"
							:disabled="scannerLocked"
							@click="onStartCameraScanning"
							:title="
								scannerLocked
									? __('Acknowledge the error to resume scanning')
									: __('Scan with Camera')
							"
							:aria-label="
								scannerLocked
									? __('Acknowledge the error to resume scanning')
									: __('Scan with Camera')
							"
						>
						</v-btn>
					</template>
				</v-text-field>
			</v-col>
			<v-col cols="3" class="pb-0" v-if="posProfile.posa_input_qty">
				<v-text-field
					density="compact"
					variant="solo"
					color="primary"
					:label="frappe._('QTY')"
					hide-details
					v-model="debounceQtyModel"
					type="text"
					@keydown.enter="onQtyEnter"
					@keydown.esc="onEsc"
					@focus="onClearQty"
				></v-text-field>
			</v-col>
			<v-col cols="2" class="pb-0" v-if="posProfile.posa_new_line">
				<v-checkbox
					v-model="newLineModel"
					color="accent"
					value="true"
					label="NLine"
					density="default"
					hide-details
				></v-checkbox>
			</v-col>
			<v-col cols="12" class="dynamic-margin-xs">
				<div class="settings-container">
					<v-btn
						v-if="context === 'purchase'"
						density="compact"
						variant="text"
						color="primary"
						prepend-icon="mdi-plus"
						@click="onOpenNewItemDialog"
						class="settings-btn"
					>
						{{ __("New Item") }}
					</v-btn>
					<v-btn
						density="compact"
						variant="text"
						color="primary"
						prepend-icon="mdi-cog-outline"
						@click="onToggleItemSettings"
						class="settings-btn"
					>
						{{ __("Settings") }}
					</v-btn>
					<v-spacer></v-spacer>
					<span
						v-if="enableBackgroundSync"
						class="text-caption text-medium-emphasis last-sync-label"
					>
						{{ __("Last sync:") }} {{ lastSyncLabel }}
					</span>
					<v-spacer></v-spacer>
					<v-btn
						density="compact"
						variant="text"
						color="primary"
						prepend-icon="mdi-refresh"
						@click="onForceReloadItems"
						class="settings-btn"
					>
						{{ __("Reload Items") }}
					</v-btn>

					<v-dialog v-model="showItemSettingsModel" max-width="400px">
						<v-card>
							<v-card-title class="text-h6 pa-4 d-flex align-center">
								<span>{{ __("Item Selector Settings") }}</span>
								<v-spacer></v-spacer>
								<v-btn
									icon="mdi-close"
									variant="text"
									density="compact"
									@click="showItemSettingsModel = false"
									:aria-label="__('Close Settings')"
								>
								</v-btn>
							</v-card-title>
							<v-divider></v-divider>
							<v-card-text class="pa-4">
								<v-switch
									v-model="tempHideQtyDecimalsModel"
									:label="__('Hide quantity decimals')"
									hide-details
									density="compact"
									color="primary"
									class="mb-2"
								></v-switch>
								<v-switch
									v-model="tempHideZeroRateItemsModel"
									:label="__('Hide zero rated items')"
									hide-details
									density="compact"
									color="primary"
								></v-switch>
								<v-switch
									v-model="tempShowLastInvoiceRateModel"
									:label="__('Show last invoice rate')"
									hide-details
									density="compact"
									color="primary"
									class="mb-2"
								></v-switch>
								<v-switch
									v-model="tempEnableBackgroundSyncModel"
									:label="__('Enable background sync')"
									hide-details
									density="compact"
									color="primary"
									class="mb-2"
								></v-switch>
								<v-text-field
									v-model="tempBackgroundSyncIntervalModel"
									:label="__('Background sync interval (seconds)')"
									type="number"
									density="compact"
									variant="outlined"
									color="primary"
									hide-details
									class="mb-2 pos-themed-input"
									:min="10"
									:disabled="!tempEnableBackgroundSyncModel"
								></v-text-field>
								<v-switch
									v-model="tempEnableCustomItemsPerPageModel"
									:label="__('Custom items per page')"
									hide-details
									density="compact"
									color="primary"
									class="mb-2"
								>
								</v-switch>
								<v-checkbox
									v-model="tempForceServerItemsModel"
									:label="__('Always fetch items from server (ignore local cache)')"
									hide-details
									density="compact"
									color="primary"
									class="mb-2"
								></v-checkbox>
								<v-text-field
									v-if="tempEnableCustomItemsPerPageModel"
									v-model="tempItemsPerPageModel"
									type="number"
									density="compact"
									variant="outlined"
									color="primary"
									hide-details
									:label="__('Items per page')"
									class="mb-2 pos-themed-input"
								>
								</v-text-field>
							</v-card-text>
							<v-card-actions class="pa-4 pt-0">
								<v-btn color="error" variant="text" @click="onCancelItemSettings">
									{{ __("Cancel") }}
								</v-btn>
								<v-spacer></v-spacer>
								<v-btn color="primary" variant="tonal" @click="onApplyItemSettings">
									{{ __("Apply") }}
								</v-btn>
							</v-card-actions>
						</v-card>
					</v-dialog>
				</div>
			</v-col>
		</v-row>
	</div>
</template>

<script>
/* global frappe, __ */
export default {
	name: "ItemsSearchHeader",
	props: {
		searchInput: {
			type: String,
			default: "",
		},
		debounceQty: {
			type: [String, Number],
			default: null,
		},
		newLine: {
			type: [String, Boolean],
			default: false,
		},
		showItemSettings: {
			type: Boolean,
			default: false,
		},
		tempHideQtyDecimals: {
			type: Boolean,
			default: false,
		},
		tempHideZeroRateItems: {
			type: Boolean,
			default: false,
		},
		tempShowLastInvoiceRate: {
			type: Boolean,
			default: true,
		},
		tempEnableBackgroundSync: {
			type: Boolean,
			default: true,
		},
		tempBackgroundSyncInterval: {
			type: [Number, String],
			default: 30,
		},
		tempEnableCustomItemsPerPage: {
			type: Boolean,
			default: false,
		},
		tempItemsPerPage: {
			type: [Number, String],
			default: 50,
		},
		tempForceServerItems: {
			type: Boolean,
			default: false,
		},
		posProfile: {
			type: Object,
			default: () => ({}),
		},
		context: {
			type: String,
			default: "pos",
		},
		scannerLocked: {
			type: Boolean,
			default: false,
		},
		enableBackgroundSync: {
			type: Boolean,
			default: false,
		},
		lastSyncLabel: {
			type: String,
			default: "",
		},
		onEnter: {
			type: Function,
			default: () => {},
		},
		onQtyEnter: {
			type: Function,
			default: () => {},
		},
		onEsc: {
			type: Function,
			default: () => {},
		},
		onSearchKeydown: {
			type: Function,
			default: () => {},
		},
		onClearSearch: {
			type: Function,
			default: () => {},
		},
		onSearchInput: {
			type: Function,
			default: () => {},
		},
		onSearchPaste: {
			type: Function,
			default: () => {},
		},
		onSearchFocus: {
			type: Function,
			default: () => {},
		},
		onStartCameraScanning: {
			type: Function,
			default: () => {},
		},
		onOpenNewItemDialog: {
			type: Function,
			default: () => {},
		},
		onToggleItemSettings: {
			type: Function,
			default: () => {},
		},
		onCancelItemSettings: {
			type: Function,
			default: () => {},
		},
		onApplyItemSettings: {
			type: Function,
			default: () => {},
		},
		onForceReloadItems: {
			type: Function,
			default: () => {},
		},
		onClearQty: {
			type: Function,
			default: () => {},
		},
	},
	computed: {
		searchInputModel: {
			get() {
				return this.searchInput;
			},
			set(value) {
				this.$emit("update:searchInput", value);
			},
		},
		debounceQtyModel: {
			get() {
				return this.debounceQty;
			},
			set(value) {
				this.$emit("update:debounceQty", value);
			},
		},
		newLineModel: {
			get() {
				return this.newLine;
			},
			set(value) {
				this.$emit("update:newLine", value);
			},
		},
		showItemSettingsModel: {
			get() {
				return this.showItemSettings;
			},
			set(value) {
				this.$emit("update:showItemSettings", value);
			},
		},
		tempHideQtyDecimalsModel: {
			get() {
				return this.tempHideQtyDecimals;
			},
			set(value) {
				this.$emit("update:tempHideQtyDecimals", value);
			},
		},
		tempHideZeroRateItemsModel: {
			get() {
				return this.tempHideZeroRateItems;
			},
			set(value) {
				this.$emit("update:tempHideZeroRateItems", value);
			},
		},
		tempShowLastInvoiceRateModel: {
			get() {
				return this.tempShowLastInvoiceRate;
			},
			set(value) {
				this.$emit("update:tempShowLastInvoiceRate", value);
			},
		},
		tempEnableBackgroundSyncModel: {
			get() {
				return this.tempEnableBackgroundSync;
			},
			set(value) {
				this.$emit("update:tempEnableBackgroundSync", value);
			},
		},
		tempBackgroundSyncIntervalModel: {
			get() {
				return this.tempBackgroundSyncInterval;
			},
			set(value) {
				this.$emit("update:tempBackgroundSyncInterval", value);
			},
		},
		tempEnableCustomItemsPerPageModel: {
			get() {
				return this.tempEnableCustomItemsPerPage;
			},
			set(value) {
				this.$emit("update:tempEnableCustomItemsPerPage", value);
			},
		},
		tempItemsPerPageModel: {
			get() {
				return this.tempItemsPerPage;
			},
			set(value) {
				this.$emit("update:tempItemsPerPage", value);
			},
		},
		tempForceServerItemsModel: {
			get() {
				return this.tempForceServerItems;
			},
			set(value) {
				this.$emit("update:tempForceServerItems", value);
			},
		},
	},
	methods: {
		focus() {
			this.$refs.searchInput?.focus?.();
		},
		blur() {
			this.$refs.searchInput?.blur?.();
		},
	},
};
</script>
