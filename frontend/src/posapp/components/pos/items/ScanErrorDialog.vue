<template>
	<v-dialog
		:model-value="modelValue"
		@update:model-value="$emit('update:modelValue', $event)"
		persistent
		max-width="420"
		content-class="scan-error-dialog"
	>
		<v-card>
			<v-card-title class="d-flex align-center text-error text-h6">
				<v-icon color="error" class="mr-2">mdi-alert-octagon</v-icon>
				{{ __("Scan Error") }}
			</v-card-title>
			<v-divider></v-divider>
			<v-card-text>
				<p class="scan-error-message">{{ errorMessage }}</p>
				<p v-if="errorCode" class="scan-error-code mt-2 mb-0">
					<strong>{{ __("Scanned Code:") }}</strong>
					<span>{{ errorCode }}</span>
				</p>
				<p v-if="errorDetails" class="scan-error-details mt-4 mb-0">
					{{ errorDetails }}
				</p>
			</v-card-text>
			<v-card-actions class="justify-end">
				<v-btn color="primary" variant="tonal" autofocus @click="acknowledge">
					{{ __("OK") }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
export default {
	name: "ScanErrorDialog",
	props: {
		modelValue: Boolean,
		errorMessage: String,
		errorCode: String,
		errorDetails: String,
	},
	emits: ["update:modelValue", "acknowledge"],
	methods: {
		acknowledge() {
			this.$emit("acknowledge");
		},
	},
};
</script>
