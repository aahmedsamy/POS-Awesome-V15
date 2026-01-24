<template>
	<v-dialog
		:model-value="modelValue"
		@update:model-value="$emit('update:modelValue', $event)"
		max-width="500px"
	>
		<v-card>
			<v-card-title class="text-h6 pa-4">
				{{ __("Create New Item") }}
			</v-card-title>
			<v-card-text class="pa-4">
				<v-row dense>
					<v-col cols="12">
						<v-text-field
							v-model="form.item_code"
							:label="frappe._('Item Code')"
							density="compact"
							variant="outlined"
							class="pos-themed-input"
							:rules="[(v) => !!v || __('* Required')]"
						></v-text-field>
					</v-col>
					<v-col cols="12">
						<v-text-field
							v-model="form.item_name"
							:label="frappe._('Item Name')"
							density="compact"
							variant="outlined"
							class="pos-themed-input"
							:rules="[(v) => !!v || __('* Required')]"
						></v-text-field>
					</v-col>
					<v-col cols="12">
						<v-select
							v-model="form.item_group"
							:items="itemGroups"
							:label="frappe._('Item Group')"
							density="compact"
							variant="outlined"
							class="pos-themed-input"
							:rules="[(v) => !!v || __('* Required')]"
						></v-select>
					</v-col>
					<v-col cols="6">
						<v-autocomplete
							v-model="form.stock_uom"
							:items="uomList"
							:label="frappe._('Stock UOM')"
							density="compact"
							variant="outlined"
							class="pos-themed-input"
							:rules="[(v) => !!v || __('* Required')]"
						></v-autocomplete>
					</v-col>
					<v-col cols="6">
						<v-text-field
							v-model="form.standard_rate"
							:label="frappe._('Standard Rate')"
							type="number"
							density="compact"
							variant="outlined"
							class="pos-themed-input"
						></v-text-field>
					</v-col>
				</v-row>
			</v-card-text>
			<v-card-actions class="pa-4 pt-0">
				<v-spacer></v-spacer>
				<v-btn color="error" variant="text" @click="close">
					{{ __("Cancel") }}
				</v-btn>
				<v-btn color="primary" variant="tonal" @click="submit" :loading="loading">
					{{ __("Create") }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
/* global frappe */
export default {
	name: "NewItemDialog",
	props: {
		modelValue: Boolean,
		itemGroups: {
			type: Array,
			default: () => [],
		},
	},
	emits: ["update:modelValue", "item-created"],
	data() {
		return {
			loading: false,
			uomList: [],
			form: {
				item_code: "",
				item_name: "",
				item_group: "",
				stock_uom: "Nos",
				standard_rate: 0,
			},
		};
	},
	watch: {
		modelValue(val) {
			if (val) {
				this.resetForm();
				this.getUoms();
			}
		},
	},
	methods: {
		resetForm() {
			this.form = {
				item_code: "",
				item_name: "",
				item_group:
					this.itemGroups.length > 0 && this.itemGroups[0] !== "ALL" ? this.itemGroups[0] : "",
				stock_uom: "Nos",
				standard_rate: 0,
			};
		},
		close() {
			this.$emit("update:modelValue", false);
		},
		async getUoms() {
			if (this.uomList.length) return;
			try {
				const r = await frappe.call({
					method: "frappe.client.get_list",
					args: {
						doctype: "UOM",
						fields: ["name"],
						limit_page_length: 0,
					},
				});
				if (r.message) {
					this.uomList = r.message.map((d) => d.name);
				}
			} catch (e) {
				console.error("Failed to fetch UOMs", e);
				this.uomList = ["Nos", "Kg", "Meter", "Box"];
			}
		},
		async submit() {
			if (
				!this.form.item_code ||
				!this.form.item_name ||
				!this.form.item_group ||
				!this.form.stock_uom
			) {
				frappe.msgprint(__("Please fill all required fields"));
				return;
			}
			this.loading = true;
			try {
				const res = await frappe.call({
					method: "frappe.client.insert",
					args: {
						doc: {
							doctype: "Item",
							item_code: this.form.item_code,
							item_name: this.form.item_name,
							item_group: this.form.item_group,
							stock_uom: this.form.stock_uom,
							standard_rate: this.form.standard_rate,
							is_stock_item: 1,
						},
					},
				});

				const newItem = res.message || res;
				newItem.actual_qty = 0;
				this.$emit("item-created", newItem);
				this.close();
				frappe.show_alert({
					message: __("Item created successfully"),
					indicator: "green",
				});
			} catch (e) {
				console.error(e);
				frappe.msgprint(__("Failed to create item"));
			} finally {
				this.loading = false;
			}
		},
	},
};
</script>
