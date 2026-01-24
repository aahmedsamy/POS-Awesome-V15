import { ref, computed, watch, nextTick } from "vue";
import { perfMarkStart, perfMarkEnd } from "../utils/perf.js";
import _ from "lodash";

export function useItemSearch(items, props, context) {
	const searchInput = ref("");
	const firstSearch = ref("");
	const searchCache = new Map();
	const showOnlyBarcodeItems = ref(props.showOnlyBarcodeItems || false);

	const clearSearch = () => {
		searchInput.value = "";
		firstSearch.value = "";
		searchCache.clear();
	};

	const performSearch = (searchTerm, itemGroup) => {
		const mark = perfMarkStart("pos:search-filter");
		if (!items.value || !items.value.length) {
			perfMarkEnd("pos:search-filter", mark);
			return [];
		}

		let filtered = items.value;

		// Filter only barcode items if enabled
		if (showOnlyBarcodeItems.value) {
			filtered = filtered.filter((item) => {
				return (
					item.barcode ||
					(Array.isArray(item.barcodes) && item.barcodes.length > 0) ||
					(Array.isArray(item.item_barcode) && item.item_barcode.length > 0)
				);
			});
		}

		// Filter by item group
		if (itemGroup && itemGroup !== "ALL") {
			const group = itemGroup.toLowerCase();
			filtered = filtered.filter((item) => item.item_group && item.item_group.toLowerCase() === group);
		}

		// Filter by search term
		const rawSearch = (searchTerm || "").trim();
		if (rawSearch && rawSearch.length >= 3) {
			const term = rawSearch.toLowerCase();
			const searchWords = term.split(/\s+/).filter(Boolean);

			filtered = filtered.filter((item) => {
				if (!searchWords.length) return true;

				// Collect all searchable values into a single string or array for checking
				const searchable = [];
				const pushValue = (v) => {
					if (v) searchable.push(String(v).toLowerCase());
				};

				pushValue(item.item_code);
				pushValue(item.item_name);
				pushValue(item.barcode);
				pushValue(item.description);
				pushValue(item.brand);

				// Handle arrays (barcodes, serials, batches)
				if (Array.isArray(item.item_barcode)) {
					item.item_barcode.forEach((b) => pushValue(b?.barcode));
				}
				if (Array.isArray(item.barcodes)) {
					item.barcodes.forEach((b) => pushValue(b));
				}
				if (Array.isArray(item.serial_no_data)) {
					item.serial_no_data.forEach((s) => pushValue(s?.serial_no));
				}
				if (Array.isArray(item.batch_no_data)) {
					item.batch_no_data.forEach((b) => pushValue(b?.batch_no));
				}

				// Verify EVERY search word is present in AT LEAST ONE of the fields
				return searchWords.every((word) => {
					return searchable.some((field) => field.includes(word));
				});
			});
		}

		perfMarkEnd("pos:search-filter", mark);
		return filtered;
	};

	const memoizedSearch = (searchTerm, itemGroup) => {
		const cacheKey = `${searchTerm || ""}_${itemGroup || "ALL"}_${showOnlyBarcodeItems.value}`;

		if (searchCache.has(cacheKey)) {
			return searchCache.get(cacheKey);
		}

		const result = performSearch(searchTerm, itemGroup);
		searchCache.set(cacheKey, result);
		return result;
	};

	return {
		searchInput,
		firstSearch,
		clearSearch,
		memoizedSearch,
		showOnlyBarcodeItems,
	};
}
