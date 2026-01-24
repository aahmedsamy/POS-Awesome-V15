<template>
	<v-card class="cards mb-0 mt-3 dynamic-padding resizable" style="resize: vertical; overflow: auto">
		<v-row no-gutters align="center" justify="center" class="dynamic-spacing-sm">
			<v-col cols="12" class="mb-2">
				<v-select
					:items="itemsGroup"
					:label="frappe._('Items Group')"
					density="compact"
					variant="solo"
					hide-details
					v-model="itemGroupModel"
				></v-select>
			</v-col>
			<v-col cols="12" class="mb-2" v-if="posProfile.posa_enable_price_list_dropdown !== false">
				<v-text-field
					density="compact"
					variant="solo"
					color="primary"
					:label="frappe._('Price List')"
					hide-details
					:model-value="activePriceList"
					readonly
				></v-text-field>
			</v-col>
			<v-col cols="3" class="dynamic-margin-xs">
				<v-btn-toggle
					v-model="itemsViewModel"
					color="primary"
					group
					density="compact"
					rounded
					class="view-toggle-btn"
				>
					<v-btn size="small" value="list">{{ __("List") }}</v-btn>
					<v-btn size="small" value="card">{{ __("Card") }}</v-btn>
				</v-btn-toggle>
			</v-col>
			<v-col cols="5" class="dynamic-margin-xs">
				<v-btn
					size="small"
					block
					color="warning"
					variant="text"
					@click="$emit('show-offers')"
					class="action-btn-consistent"
				>
					{{ offersCount }} {{ __("Offers") }}
				</v-btn>
			</v-col>
			<v-col cols="4" class="dynamic-margin-xs">
				<v-btn
					size="small"
					block
					color="primary"
					variant="text"
					@click="$emit('show-coupons')"
					class="action-btn-consistent"
				>
					{{ couponsCount }} {{ __("Coupons") }}
				</v-btn>
			</v-col>
		</v-row>
	</v-card>
</template>

<script>
/* global frappe, __ */

export default {
	name: "ItemsFooterActions",
	props: {
		itemsGroup: {
			type: Array,
			default: () => [],
		},
		itemGroup: {
			type: String,
			default: "",
		},
		itemsView: {
			type: String,
			default: "list",
		},
		activePriceList: {
			type: String,
			default: "",
		},
		offersCount: {
			type: [Number, String],
			default: 0,
		},
		couponsCount: {
			type: [Number, String],
			default: 0,
		},
		posProfile: {
			type: Object,
			default: () => ({}),
		},
	},
	computed: {
		itemGroupModel: {
			get() {
				return this.itemGroup;
			},
			set(value) {
				this.$emit("update:itemGroup", value);
			},
		},
		itemsViewModel: {
			get() {
				return this.itemsView;
			},
			set(value) {
				this.$emit("update:itemsView", value);
			},
		},
	},
};
</script>
