<template>
	<div class="sticky-header">
		<v-row class="items">
			<v-col class="pb-0">
				<v-text-field
					density="compact"
					clearable
					autofocus
					variant="solo"
					color="primary"
					:label="frappe._('Search Items')"
					hint="Search by item code, serial number, batch no or barcode"
					hide-details
					:model-value="searchInput"
					@update:model-value="$emit('update:searchInput', $event)"
					@keydown.esc="$emit('keydown-esc')"
					@keydown.enter="$emit('keydown-enter')"
					@keydown="$emit('keydown', $event)"
					@click:clear="$emit('clear-search')"
					@input="$emit('input', $event)"
					@paste="$emit('paste', $event)"
					prepend-inner-icon="mdi-magnify"
					@focus="$emit('focus', $event)"
					ref="debounce_search"
				>
					<template v-slot:append-inner>
						<v-btn
							v-if="posProfile.posa_enable_camera_scanning"
							icon="mdi-camera"
							size="small"
							color="primary"
							variant="text"
							:disabled="scannerLocked"
							@click="$emit('start-camera-scanning')"
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
					:model-value="qty"
					@update:model-value="$emit('update:qty', $event)"
					type="text"
					@keydown.enter="$emit('qty-enter')"
					@keydown.esc="$emit('qty-esc')"
					@focus="$emit('qty-focus')"
				></v-text-field>
			</v-col>
			<v-col cols="2" class="pb-0" v-if="posProfile.posa_new_line">
				<v-checkbox
					:model-value="newLine"
					@update:model-value="$emit('update:newLine', $event)"
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
						@click="$emit('open-new-item')"
						class="settings-btn"
					>
						{{ __("New Item") }}
					</v-btn>
					<v-btn
						density="compact"
						variant="text"
						color="primary"
						prepend-icon="mdi-cog-outline"
						@click="$emit('toggle-settings')"
						class="settings-btn"
					>
						{{ __("Settings") }}
					</v-btn>
					<v-spacer></v-spacer>
					<span
						v-if="enableBackgroundSync"
						class="text-caption text-medium-emphasis last-sync-label"
					>
						{{ __("Last sync:") }} {{ formattedSyncTime }}
					</span>
					<v-spacer></v-spacer>
					<v-btn
						density="compact"
						variant="text"
						color="primary"
						prepend-icon="mdi-refresh"
						@click="$emit('reload-items')"
						class="settings-btn"
					>
						{{ __("Reload Items") }}
					</v-btn>
				</div>
			</v-col>
		</v-row>
	</div>
</template>

<script>
/* global frappe */
export default {
	name: "ItemSearchBar",
	props: {
		searchInput: String,
		qty: [String, Number],
		newLine: Boolean,
		posProfile: {
			type: Object,
			default: () => ({}),
		},
		scannerLocked: Boolean,
		context: String,
		enableBackgroundSync: Boolean,
		lastSyncTime: [String, Number, Date],
	},
	emits: [
		"update:searchInput",
		"update:qty",
		"update:newLine",
		"keydown-esc",
		"keydown-enter",
		"keydown",
		"clear-search",
		"input",
		"paste",
		"focus",
		"start-camera-scanning",
		"qty-enter",
		"qty-esc",
		"qty-focus",
		"open-new-item",
		"toggle-settings",
		"reload-items",
	],
	computed: {
		formattedSyncTime() {
			if (!this.lastSyncTime) return this.__("Never");
			try {
				const date = new Date(this.lastSyncTime);
				if (isNaN(date.getTime())) return this.__("Never");
				return date.toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				});
			} catch (e) {
				return this.__("Error");
			}
		},
	},
};
</script>

<style scoped>
.settings-container {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
}
.settings-btn {
	text-transform: none !important;
	letter-spacing: normal !important;
	font-weight: 500;
}
.last-sync-label {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>
