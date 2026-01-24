<template>
	<div class="h-100">
		<div v-if="itemsView === 'card'" class="items-card-container h-100">
			<div v-if="isLoadingOrSyncing" class="items-card-grid h-100">
				<Skeleton v-for="n in 8" :key="n" class="mb-4" height="120" />
			</div>
			<div
				v-else-if="displayedItems.length === 0"
				class="d-flex flex-column align-center justify-center text-center fill-height pa-4"
				style="height: 100%; min-height: 200px"
			>
				<v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-package-variant-closed</v-icon>
				<div class="text-h6 text-medium-emphasis mb-1">
					{{ __("No items found") }}
				</div>
				<div class="text-body-2 text-medium-emphasis">
					{{ __("Try adjusting your search or filters") }}
				</div>
				<v-btn
					v-if="hasFilter"
					variant="text"
					color="primary"
					class="mt-4"
					@click="$emit('clear-search')"
				>
					{{ __("Clear Search") }}
				</v-btn>
			</div>
			<RecycleScroller
				v-else
				ref="itemsContainer"
				class="virtual-scroller h-100"
				:list-class="['items-virtual-list', { 'item-container': isOverflowing }]"
				:items="displayedItems"
				key-field="item_code"
				:item-size="cardSlotHeight"
				:grid-items="cardColumns"
				:item-secondary-size="cardSlotWidth"
				:buffer="virtualScrollBuffer"
				:emit-update="true"
				@update="$emit('virtual-range-update', $event)"
			>
				<template #default="{ item }">
					<div
						v-if="item"
						:key="item.item_code"
						:class="['card-item-card', { 'item-highlighted': isItemHighlighted(item) }]"
						:style="{
							width: cardColumnWidth + 'px',
							height: cardRowHeight + 'px',
						}"
						@click="$emit('select-item', $event, item)"
						:draggable="true"
						@dragstart="$emit('drag-start', $event, item)"
						@dragend="$emit('drag-end')"
					>
						<div class="card-item-image-container">
							<v-img
								:src="item.image || placeholderImage"
								class="card-item-image"
								aspect-ratio="1"
								:alt="item.item_name"
							>
								<template #placeholder>
									<div class="image-placeholder">
										<v-icon size="40" color="grey-lighten-2"> mdi-image </v-icon>
									</div>
								</template>
							</v-img>
						</div>
						<div class="card-item-content">
							<div class="card-item-header">
								<h4 class="card-item-name">{{ item.item_name }}</h4>
								<span class="card-item-code">{{ item.item_code }}</span>
							</div>
							<div class="card-item-details">
								<div class="card-item-price">
									<div class="primary-price">
										<span class="currency-symbol">
											{{
												currencySymbol(item.original_currency || posProfile.currency)
											}}
										</span>
										<span v-if="context === 'purchase'" class="price-amount">
											{{
												formatCurrency(
													item.rate || item.standard_rate || 0,
													posProfile.currency,
													ratePrecision(item.rate || item.standard_rate || 0),
												)
											}}
										</span>
										<span v-else class="price-amount">
											{{
												formatCurrency(
													item.original_rate ?? item.rate ?? 0,
													item.original_currency || posProfile.currency,
													ratePrecision(item.original_rate ?? item.rate ?? 0),
												)
											}}
										</span>
									</div>
									<div
										v-if="
											context !== 'purchase' &&
											posProfile.posa_allow_multi_currency &&
											selectedCurrency !== posProfile.currency
										"
										class="secondary-price"
									>
										<span class="currency-symbol">
											{{ currencySymbol(selectedCurrency) }}
										</span>
										<span class="price-amount">
											{{
												formatCurrency(
													item.rate,
													selectedCurrency,
													ratePrecision(item.rate),
												)
											}}
										</span>
									</div>
									<div v-if="getLastInvoiceRate(item)" class="last-rate-chip">
										<v-icon size="14" class="mr-1" color="secondary">mdi-history</v-icon>
										<span class="last-rate-label">{{ __("Last") }}:</span>
										<span class="last-rate-value">
											{{
												currencySymbol(
													getLastInvoiceRate(item).currency || posProfile.currency,
												)
											}}
											{{
												formatCurrency(
													getLastInvoiceRate(item).rate,
													getLastInvoiceRate(item).currency || posProfile.currency,
													ratePrecision(getLastInvoiceRate(item).rate || 0),
												)
											}}
											<span v-if="getLastInvoiceRate(item).uom" class="last-rate-uom">
												/{{ getLastInvoiceRate(item).uom }}
											</span>
										</span>
									</div>
								</div>
								<div class="card-item-stock">
									<v-icon size="small" class="stock-icon"> mdi-package-variant </v-icon>
									<span
										class="stock-amount"
										:class="{
											'negative-number': isNegative(item.actual_qty),
										}"
									>
										{{ formatNumber(item.actual_qty, hideQtyDecimals ? 0 : 4) || 0 }}
									</span>
									<span class="stock-uom">{{ item.stock_uom || "" }}</span>
								</div>
							</div>
						</div>
					</div>
				</template>
			</RecycleScroller>
		</div>
		<div v-else class="items-table-container h-100">
			<v-data-table-virtual
				ref="itemsTable"
				:headers="headers"
				:items="displayedItems"
				class="sleek-data-table overflow-y-auto h-100"
				item-key="item_code"
				fixed-header
				height="100%"
				:header-props="headerProps"
				:no-data-text="__('No items found')"
				@click:row="(e, row) => $emit('click-row', e, row)"
				:item-class="getItemRowClass"
				:row-props="getItemRowProps"
				@scroll.passive="$emit('list-scroll', $event)"
			>
				<template v-slot:item.rate="{ item }">
					<div v-if="context !== 'purchase'">
						<div class="text-primary">
							{{ currencySymbol(item.original_currency || posProfile.currency) }}
							{{
								formatCurrency(
									item.original_rate ?? item.rate ?? 0,
									item.original_currency || posProfile.currency,
									ratePrecision(item.original_rate ?? item.rate ?? 0),
								)
							}}
						</div>
						<div
							v-if="getLastInvoiceRate(item)"
							class="text-caption d-flex align-center last-rate-inline"
						>
							<v-icon size="14" class="mr-1" color="secondary">mdi-history</v-icon>
							<span class="mr-1">{{ __("Last") }}:</span>
							<span class="font-weight-medium">
								{{ currencySymbol(getLastInvoiceRate(item).currency || posProfile.currency) }}
								{{
									formatCurrency(
										getLastInvoiceRate(item).rate,
										getLastInvoiceRate(item).currency || posProfile.currency,
										ratePrecision(getLastInvoiceRate(item).rate || 0),
									)
								}}
								<span v-if="getLastInvoiceRate(item).uom" class="last-rate-uom">
									/{{ getLastInvoiceRate(item).uom }}
								</span>
							</span>
						</div>
						<div
							v-if="
								posProfile.posa_allow_multi_currency &&
								selectedCurrency !== posProfile.currency
							"
							class="text-success"
						>
							{{ currencySymbol(selectedCurrency) }}
							{{ formatCurrency(item.rate, selectedCurrency, ratePrecision(item.rate)) }}
						</div>
					</div>
					<div v-else class="text-primary">
						{{ currencySymbol(posProfile.currency) }}
						{{
							formatCurrency(
								item.rate || item.standard_rate || 0,
								posProfile.currency,
								ratePrecision(item.rate || item.standard_rate || 0),
							)
						}}
					</div>
				</template>
				<template v-slot:item.actual_qty="{ item }">
					<span class="golden--text" :class="{ 'negative-number': isNegative(item.actual_qty) }">{{
						formatNumber(item.actual_qty, hideQtyDecimals ? 0 : 4)
					}}</span>
				</template>
			</v-data-table-virtual>
		</div>
	</div>
</template>

<script>
/* global frappe, get_currency_symbol */
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { RecycleScroller } from "vue-virtual-scroller";
import Skeleton from "../../ui/Skeleton.vue";
import placeholderImage from "../placeholder-image.png";
import format from "../../../format";

export default {
	name: "ItemsList",
	mixins: [format],
	components: {
		RecycleScroller,
		Skeleton,
	},
	props: {
		itemsView: String,
		isLoadingOrSyncing: Boolean,
		displayedItems: Array,
		hasFilter: Boolean,
		posProfile: Object,
		context: String,
		selectedCurrency: String,
		hideQtyDecimals: Boolean,
		cardSlotHeight: Number,
		cardSlotWidth: Number,
		cardColumns: Number,
		cardColumnWidth: Number,
		cardRowHeight: Number,
		virtualScrollBuffer: Number,
		isOverflowing: Boolean,
		headers: Array,
		headerProps: Object,
		highlightedIndex: Number,
		highlightedItemCode: String,
		lastInvoiceRates: Object,
		showLastInvoiceRate: Boolean,
	},
	emits: [
		"clear-search",
		"virtual-range-update",
		"select-item",
		"drag-start",
		"drag-end",
		"click-row",
		"list-scroll",
	],
	data() {
		return {
			placeholderImage,
		};
	},
	methods: {
		isItemHighlighted(item) {
			if (this.highlightedItemCode) {
				return item.item_code === this.highlightedItemCode;
			}
			return false;
		},
		getLastInvoiceRate(item) {
			if (!this.showLastInvoiceRate) return null;
			return this.lastInvoiceRates && item.item_code ? this.lastInvoiceRates[item.item_code] : null;
		},
		currencySymbol(currency) {
			return get_currency_symbol(currency);
		},
		formatCurrency(amount, currency, precision) {
			// Using mixin method but can fallback if not available
			if (this.format_currency) return this.format_currency(amount, currency, precision);
			return amount;
		},
		formatNumber(number, precision) {
			if (this.format_number) return this.format_number(number, null, precision);
			return number;
		},
		ratePrecision(rate) {
			// Basic logic if mixin fails
			return 2;
		},
		isNegative(num) {
			return num < 0;
		},
		getItemRowClass(item) {
			return this.isItemHighlighted(item.item) ? "highlighted-row" : "";
		},
		getItemRowProps(item) {
			return {
				class: this.isItemHighlighted(item.item) ? "highlighted-row" : "",
			};
		},
	},
};
</script>
