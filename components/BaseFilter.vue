<script setup lang="ts">
import { Filter } from '@element-plus/icons-vue'

interface Satellite {
	id: number;
	name: string;
	noradCatId: number;
	orbitCode: string;
	objectType: string;
	countryCode: string;
	launchDate: string;
}

// Props
const props = defineProps<{
	data: Satellite[];
}>();

// Emits
const emit = defineEmits<{
	(e: 'filter', filtered: Satellite[]): void;
}>();

const drawerVisible = ref(false);
const selectedTypes = ref<string[]>([]);
const selectedOrbits = ref<string[]>([]);

// Orbit list
const orbitCodes = [
	"LEO", "LEO1", "LEO2", "LEO3", "LEO4", "MEO", "GEO", "HEO",
	"IGO", "EGO", "NSO", "GTO", "GHO", "HAO", "MGO", "LMO", "UFO", "ESO", "UNKNOWN",
];

// Compute object type list and counts
const objectTypes = computed(() => {
	const counts: Record<string, number> = {};
	props.data.forEach((item) => {
		counts[item.objectType] = (counts[item.objectType] || 0) + 1;
	});
	return Object.entries(counts).map(([type, count]) => ({ type, count }));
});

const orbitTypeCounts = computed(() => {
	const counts: Record<string, number> = {};
	props.data.forEach((item) => {
		counts[item.orbitCode] = (counts[item.orbitCode] || 0) + 1;
	});
	return Object.entries(counts).map(([code, count]) => ({ code, count }));
});

// Total active filter count
const activeFilterCount = computed(() => selectedTypes.value.length + selectedOrbits.value.length);

// Filter 
const applyFilters = () => {
	const copy = [...props.data]
	const filtered = copy?.filter((item) => {
		const matchType = selectedTypes.value.length === 0 || selectedTypes.value.includes(item.objectType);
		const matchOrbit = selectedOrbits.value.length === 0 || selectedOrbits.value.includes(item.orbitCode);
		return matchType && matchOrbit;
	});
	emit("filter", filtered);
	drawerVisible.value = false;
};

// Reset all filters
const resetFilters = () => {
	selectedTypes.value = [];
	selectedOrbits.value = [];
	emit("filter", [...props.data]);
	drawerVisible.value = false;
};

const drawerSize = computed(() => {
	const width = window.innerWidth;
	if (width >= 1024) return '30%'; 
	if (width >= 768) return '50%';  
	return '50%';                   
});
</script>

<template>
	<el-badge :value="activeFilterCount" class="ml-2" :hidden="activeFilterCount === 0">
		<el-button type="dark" @click="drawerVisible = true">
			<template #icon>
				<el-icon>
					<Filter />
				</el-icon>
			</template>
			Filter
		</el-button>
	</el-badge>

	<el-drawer v-model="drawerVisible" direction="rtl" :size="drawerSize" :class="['custom-drawer']">
		<template #header>
			<h1 class="text-2xl text-white">Filter Satellites</h1>
		</template>
		<div class="space-y-6 text-white">
			<div>
				<label class="font-semibold block mb-2 text-white">Object Types</label>
				<el-select v-model="selectedTypes" multiple filterable placeholder="Select object types" class="w-full dark-select">
					<el-option v-for="item in objectTypes" :key="item.type" :label="`${item.type} (${item.count})`" :value="item.type" />
				</el-select>
			</div>

			<div>
				<label class="font-semibold block mb-2 text-white">Orbit Codes</label>
				<el-select v-model="selectedOrbits" multiple filterable placeholder="Select orbit codes" class="w-full dark-select">
					<el-option v-for="item in orbitTypeCounts" :key="item.code" :label="`${item.code} (${item.count})`" :value="item.code" />
				</el-select>
			</div>

			<div class="pt-6 flex gap-2">
				<el-button type="primary" @click="applyFilters">Apply Filters</el-button>
				<el-button @click="resetFilters">Reset</el-button>
			</div>
		</div>
	</el-drawer>
</template>
<style>
.custom-drawer {
	background-color: #1a1a2e;
	/* Dark blue-gray for contrast */
	color: #ffffff;
	padding: 24px;
	border-left: 1px solid #ffffff;
	box-shadow: -4px 0 12px rgba(0, 0, 0, 0.6);
	/* subtle shadow to elevate drawer */
}

/* Drawer Title */
.custom-drawer h3,
.custom-drawer h4,
.custom-drawer label {
	color: #ffffff;
	font-weight: 600;
}

/* Buttons */
.custom-drawer .el-button--primary {
	background-color: #2563eb;
	/* Tailwind blue-600 */
	border-color: #2563eb;
	color: white;
}

.custom-drawer .el-button--default {
	background-color: #f3f4f6;
	/* Tailwind gray-100 */
	color: #111827;
	/* Tailwind gray-900 */
}

/* Style El-Select dropdown (dark mode) */
.dark-select .el-input__inner {
	background-color: #2c2c3c;
	color: white;
	border-color: #4a4a5c;
}

.dark-select .el-select-dropdown {
	background-color: #2c2c3c;
	color: white;
}

/* Option hover and active styles */
.el-select-dropdown__item:hover {
	background-color: #3c3c4c;
	color: white;
}
</style>
