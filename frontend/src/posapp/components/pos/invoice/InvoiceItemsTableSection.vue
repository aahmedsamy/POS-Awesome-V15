<template>
	<div class="items-table-wrapper">
		<div class="column-selector-container">
			<v-text-field
				v-model="itemSearchModel"
				density="compact"
				variant="solo"
				color="primary"
				class="item-search-field pos-themed-input"
				:label="__('Search items or barcode')"
				prepend-inner-icon="mdi-magnify"
				hide-details
				clearable
				autocomplete="off"
			></v-text-field>
			<v-btn
				density="compact"
				variant="text"
				color="primary"
				prepend-icon="mdi-cog-outline"
				@click="$emit('toggle-column-selection')"
				class="column-selector-btn"
			>
				{{ __("Columns") }}
			</v-btn>
			<v-dialog v-model="showColumnSelectorModel" max-width="500px">
				<v-card>
					<v-card-title class="text-h6 pa-4 d-flex align-center">
						<span>{{ __("Select Columns to Display") }}</span>
						<v-spacer></v-spacer>
						<v-btn
							icon="mdi-close"
							variant="text"
							density="compact"
							@click="showColumnSelectorModel = false"
						></v-btn>
					</v-card-title>
					<v-divider></v-divider>
					<v-card-text class="pa-4">
						<v-row dense>
							<v-col
								cols="12"
								v-for="column in availableColumns.filter((col) => !col.required)"
								:key="column.key"
							>
								<v-switch
									v-model="tempSelectedColumnsModel"
									:label="column.title"
									:value="column.key"
									hide-details
									density="compact"
									color="primary"
									class="column-switch mb-1"
									:disabled="column.required"
								></v-switch>
							</v-col>
						</v-row>
						<div class="text-caption mt-2">
							{{ __("Required columns cannot be hidden") }}
						</div>
					</v-card-text>
					<v-card-actions class="pa-4 pt-0">
						<v-btn color="error" variant="text" @click="$emit('cancel-column-selection')">
							{{ __("Cancel") }}
						</v-btn>
						<v-spacer></v-spacer>
						<v-btn color="primary" variant="tonal" @click="$emit('update-selected-columns')">
							{{ __("Apply") }}
						</v-btn>
					</v-card-actions>
				</v-card>
			</v-dialog>
		</div>

		<ItemsTable
			:headers="itemsHeaders"
			v-model:expanded="expandedModel"
			:itemsPerPage="itemsPerPage"
			:itemSearch="itemSearch"
			:pos_profile="posProfile"
			:invoiceType="invoiceType"
			:stock_settings="stockSettings"
			:displayCurrency="displayCurrency"
			:formatFloat="formatFloat"
			:formatCurrency="formatCurrency"
			:currencySymbol="currencySymbol"
			:isNumber="isNumber"
			:setFormatedQty="setFormatedQty"
			:setFormatedCurrency="setFormatedCurrency"
			:calcPrices="calcPrices"
			:calcUom="calcUom"
			:setSerialNo="setSerialNo"
			:setBatchQty="setBatchQty"
			:validateDueDate="validateDueDate"
			:removeItem="removeItem"
			:subtractOne="subtractOne"
			:addOne="addOne"
			:toggleOffer="toggleOffer"
			:changePriceListRate="changePriceListRate"
			:isNegative="isNegative"
			@update:expanded="$emit('update:expanded', $event)"
			@reorder-items="$emit('reorder-items', $event)"
			@add-item-from-drag="$emit('add-item-from-drag', $event)"
			@show-drop-feedback="$emit('show-drop-feedback', $event)"
			@item-dropped="$emit('item-dropped', $event)"
			@view-packed="$emit('view-packed', $event)"
		/>
		<v-dialog v-model="showPackedDialogModel" max-width="800px">
			<v-card>
				<v-card-title class="d-flex align-center">
					<span>{{ __("Packing List") }} ({{ packedDialogItems.length }})</span>
					<v-spacer></v-spacer>
					<v-btn
						icon="mdi-close"
						variant="text"
						density="compact"
						@click="showPackedDialogModel = false"
					></v-btn>
				</v-card-title>
				<v-divider></v-divider>
				<v-card-text>
					<v-alert type="warning" density="compact" class="mb-2">
						{{
							__(
								"For 'Product Bundle' items, Warehouse, Serial No and Batch No will be considered from the 'Packing List' table. If Warehouse and Batch No are same for all packing items for any 'Product Bundle' item, those values can be entered in the main Item table; values will be copied to 'Packing List' table.",
							)
						}}
					</v-alert>
					<v-data-table
						:headers="packedItemsHeaders"
						:items="packedDialogItems"
						class="elevation-1"
						hide-default-footer
						density="compact"
					>
						<template v-slot:item.index="{ index }">
							{{ index + 1 }}
						</template>
						<template v-slot:item.qty="{ item }">
							{{ formatFloat(item.qty) }}
						</template>
						<template v-slot:item.rate="{ item }">
							<div class="currency-display">
								<span class="currency-symbol">{{ currencySymbol(displayCurrency) }}</span>
								<span class="amount-value">{{ formatCurrency(item.rate) }}</span>
							</div>
						</template>
						<template v-slot:item.warehouse="{ item }">
							<v-text-field v-model="item.warehouse" hide-details density="compact" />
						</template>
						<template v-slot:item.batch_no="{ item }">
							<v-text-field v-model="item.batch_no" hide-details density="compact" />
						</template>
						<template v-slot:item.serial_no="{ item }">
							<v-text-field v-model="item.serial_no" hide-details density="compact" />
						</template>
					</v-data-table>
				</v-card-text>
			</v-card>
		</v-dialog>
	</div>
</template>

<script>
import ItemsTable from "../ItemsTable.vue";

export default {
	name: "InvoiceItemsTableSection",
	components: {
		ItemsTable,
	},
	props: {
		itemSearch: {
			type: String,
			default: "",
		},
		showColumnSelector: {
			type: Boolean,
			default: false,
		},
		tempSelectedColumns: {
			type: Array,
			default: () => [],
		},
		availableColumns: {
			type: Array,
			default: () => [],
		},
		itemsHeaders: {
			type: Array,
			default: () => [],
		},
		expanded: {
			type: Array,
			default: () => [],
		},
		itemsPerPage: {
			type: Number,
			default: 0,
		},
		posProfile: {
			type: Object,
			default: () => ({}),
		},
		invoiceType: {
			type: String,
			default: "",
		},
		stockSettings: {
			type: Object,
			default: () => ({}),
		},
		displayCurrency: {
			type: String,
			default: "",
		},
		formatFloat: {
			type: Function,
			default: () => {},
		},
		formatCurrency: {
			type: Function,
			default: () => {},
		},
		currencySymbol: {
			type: Function,
			default: () => {},
		},
		isNumber: {
			type: Function,
			default: () => {},
		},
		setFormatedQty: {
			type: Function,
			default: () => {},
		},
		setFormatedCurrency: {
			type: Function,
			default: () => {},
		},
		calcPrices: {
			type: Function,
			default: () => {},
		},
		calcUom: {
			type: Function,
			default: () => {},
		},
		setSerialNo: {
			type: Function,
			default: () => {},
		},
		setBatchQty: {
			type: Function,
			default: () => {},
		},
		validateDueDate: {
			type: Function,
			default: () => {},
		},
		removeItem: {
			type: Function,
			default: () => {},
		},
		subtractOne: {
			type: Function,
			default: () => {},
		},
		addOne: {
			type: Function,
			default: () => {},
		},
		toggleOffer: {
			type: Function,
			default: () => {},
		},
		changePriceListRate: {
			type: Function,
			default: () => {},
		},
		isNegative: {
			type: Function,
			default: () => {},
		},
		showPackedDialog: {
			type: Boolean,
			default: false,
		},
		packedDialogItems: {
			type: Array,
			default: () => [],
		},
		packedItemsHeaders: {
			type: Array,
			default: () => [],
		},
	},
	computed: {
		itemSearchModel: {
			get() {
				return this.itemSearch;
			},
			set(value) {
				this.$emit("update:itemSearch", value);
			},
		},
		showColumnSelectorModel: {
			get() {
				return this.showColumnSelector;
			},
			set(value) {
				this.$emit("update:showColumnSelector", value);
			},
		},
		tempSelectedColumnsModel: {
			get() {
				return this.tempSelectedColumns;
			},
			set(value) {
				this.$emit("update:tempSelectedColumns", value);
			},
		},
		expandedModel: {
			get() {
				return this.expanded;
			},
			set(value) {
				this.$emit("update:expanded", value);
			},
		},
		showPackedDialogModel: {
			get() {
				return this.showPackedDialog;
			},
			set(value) {
				this.$emit("update:showPackedDialog", value);
			},
		},
	},
};
</script>
