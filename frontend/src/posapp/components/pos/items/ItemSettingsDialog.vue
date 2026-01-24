<template>
	<v-dialog
		:model-value="modelValue"
		@update:model-value="$emit('update:modelValue', $event)"
		max-width="400px"
	>
		<v-card>
			<v-card-title class="text-h6 pa-4 d-flex align-center">
				<span>{{ __("Item Selector Settings") }}</span>
				<v-spacer></v-spacer>
				<v-btn
					icon="mdi-close"
					variant="text"
					density="compact"
					@click="close"
					:aria-label="__('Close Settings')"
				>
				</v-btn>
			</v-card-title>
			<v-divider></v-divider>
			<v-card-text class="pa-4">
				<v-switch
					v-model="localSettings.hideQtyDecimals"
					:label="__('Hide quantity decimals')"
					hide-details
					density="compact"
					color="primary"
					class="mb-2"
				></v-switch>
				<v-switch
					v-model="localSettings.hideZeroRateItems"
					:label="__('Hide zero rated items')"
					hide-details
					density="compact"
					color="primary"
				></v-switch>
				<v-switch
					v-model="localSettings.showLastInvoiceRate"
					:label="__('Show last invoice rate')"
					hide-details
					density="compact"
					color="primary"
					class="mb-2"
				></v-switch>
				<v-switch
					v-model="localSettings.enableBackgroundSync"
					:label="__('Enable background sync')"
					hide-details
					density="compact"
					color="primary"
					class="mb-2"
				></v-switch>
				<v-text-field
					v-model="localSettings.backgroundSyncInterval"
					:label="__('Background sync interval (seconds)')"
					type="number"
					density="compact"
					variant="outlined"
					color="primary"
					hide-details
					class="mb-2 pos-themed-input"
					:min="10"
					:disabled="!localSettings.enableBackgroundSync"
				></v-text-field>
				<v-switch
					v-model="localSettings.enableCustomItemsPerPage"
					:label="__('Custom items per page')"
					hide-details
					density="compact"
					color="primary"
					class="mb-2"
				>
				</v-switch>
				<v-checkbox
					v-model="localSettings.forceServerItems"
					:label="__('Always fetch items from server (ignore local cache)')"
					hide-details
					density="compact"
					color="primary"
					class="mb-2"
				></v-checkbox>
				<v-text-field
					v-if="localSettings.enableCustomItemsPerPage"
					v-model="localSettings.itemsPerPage"
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
				<v-btn color="error" variant="text" @click="close">
					{{ __("Cancel") }}
				</v-btn>
				<v-spacer></v-spacer>
				<v-btn color="primary" variant="tonal" @click="apply">
					{{ __("Apply") }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
export default {
	name: "ItemSettingsDialog",
	props: {
		modelValue: Boolean,
		settings: {
			type: Object,
			default: () => ({}),
		},
	},
	emits: ["update:modelValue", "apply"],
	data() {
		return {
			localSettings: { ...this.settings },
		};
	},
	watch: {
		modelValue(val) {
			if (val) {
				this.localSettings = { ...this.settings };
			}
		},
	},
	methods: {
		close() {
			this.$emit("update:modelValue", false);
		},
		apply() {
			this.$emit("apply", this.localSettings);
			this.close();
		},
	},
};
</script>
