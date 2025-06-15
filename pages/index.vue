<script setup lang="ts">
interface Satellite {
	id: number;
	name: string;
	noradCatId: number;
	orbitCode: string;
	objectType: string;
	countryCode: string;
	launchDate: string;
}

interface ApiResponse {
	status: string;
	data: Satellite[];
}

interface Column {
	title: string;
	key: keyof Satellite | "select";
	dataKey?: keyof Satellite;
	width?: number;
	sortable?: boolean;
}



const searchQuery = ref("");
const rawData = ref<Satellite[]>([]);
const tableData = ref<Satellite[]>([]);
const loading = ref(false);
const selectedIds = ref<Set<number>>(new Set());
const selectionError = ref("");
const sortKey = ref<keyof Satellite | null>(null);
const sortDirection = ref<"asc" | "desc" | null>(null);
const tableWidth = ref(1000);

const columns = ref<Column[]>([
	{ title: "", key: "select", width: 50 },
	{ title: "Name", key: "name", dataKey: "name", width: 200, sortable: true },
	{ title: "NORAD ID", key: "noradCatId", dataKey: "noradCatId", width: 150, sortable: true },
	{ title: "Orbit", key: "orbitCode", dataKey: "orbitCode", width: 120 },
	{ title: "Type", key: "objectType", dataKey: "objectType", width: 140 },
	{ title: "Country", key: "countryCode", dataKey: "countryCode", width: 120, sortable: true },
	{ title: "Launch Date", key: "launchDate", dataKey: "launchDate", width: 180, sortable: true },
]);

const getTableData = async () => {
	loading.value = true;
	try {
		tableData.value = []
		const res = await useApiFetch('/satellites?objectTypes=ROCKET BODY,DEBRIS,UNKNOWN,PAYLOAD&attributes=name,noradCatId,orbitCode,objectType,countryCode,launchDate', 'GET', {
		});
		rawData.value = res?.data ?? [];
		filterAndSortData();
	} catch (error) {
		console.error("Fetch error:", error);
	} finally {
		loading.value = false;
	}
};

const filterAndSortData = () => {
	let data = [...rawData.value];

	if (selectedType.value) {
		data = data.filter((item) => item.objectType === selectedType.value);
	}

	// Search
	if (searchQuery.value.trim()) {
		const q = searchQuery.value.toLowerCase();
		data = data.filter((item) => item.name.toLowerCase().includes(q));
	}

	// Sort
	if (sortKey.value && sortDirection.value) {
		const key = sortKey.value;
		data.sort((a, b) => {
			const valA = a[key];
			const valB = b[key];

			if (typeof valA === "number" && typeof valB === "number") {
				return sortDirection.value === "asc" ? valA - valB : valB - valA;
			}

			const strA = String(valA).toLowerCase();
			const strB = String(valB).toLowerCase();
			return sortDirection.value === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
		});
	}
	tableData.value = data;
};

const handleKeyPress = (e: KeyboardEvent) => {
	if (e.key === "Enter") filterAndSortData();
};

const clearSearch = () => {
	searchQuery.value = "";
	filterAndSortData();
};

const handleHeaderClick = (column: Column) => {
	if (!column.sortable) return;

	if (sortKey.value === column.key) {
		if (sortDirection.value === "asc") {
			sortDirection.value = "desc";
		} else if (sortDirection.value === "desc") {
			sortKey.value = null;
			sortDirection.value = null;
		} else {
			sortDirection.value = "asc";
		}
	} else {
		sortKey.value = column.key as keyof Satellite;
		sortDirection.value = "asc";
	}

	filterAndSortData();
};

const isSelected = (id: number) => {
	return selectedIds.value.has(id);
};

const onCheckboxChange = (event: Event, row: Satellite) => {
	const checked = (event.target as HTMLInputElement).checked;
	const key = "selectedSatellites";

	const currentStorage = JSON.parse(localStorage.getItem(key) || "[]") as Satellite[];

	if (checked) {
		if (selectedIds.value.size >= 10) {
			selectionError.value = "You can select a maximum of 10 items.";
			(event.target as HTMLInputElement).checked = false;
			return;
		}
		selectedIds.value.add(row.noradCatId);
		selectionError.value = "";


		if (!currentStorage.some((item) => item.noradCatId === row.noradCatId)) {
			currentStorage.push(row);
			localStorage.setItem(key, JSON.stringify(currentStorage));
		}
	} else {
		selectedIds.value.delete(row.noradCatId);
		selectionError.value = "";

		const updatedStorage = currentStorage.filter((item) => item.noradCatId !== row.noradCatId);
		localStorage.setItem(key, JSON.stringify(updatedStorage));
	}
};

const restoreSelectionFromStorage = () => {
	const key = "selectedSatellites";
	const saved = JSON.parse(localStorage.getItem(key) || "[]") as Satellite[];
	saved.forEach((row) => {
		selectedIds.value.add(row.noradCatId);
	});
};

const isAllSelected = computed(() => selectedIds.value.size === 10);

const toggleSelectAll = (event: Event) => {
	const checked = (event.target as HTMLInputElement).checked;
	const key = "selectedSatellites";
	const currentStorage = JSON.parse(localStorage.getItem(key) || "[]") as Satellite[];

	if (checked) {
		const itemsToSelect = tableData.value.filter((item: any) => !selectedIds.value.has(item.noradCatId)).slice(0, 10 - selectedIds.value.size);

		for (const row of itemsToSelect) {
			selectedIds.value.add(row.noradCatId);
			if (!currentStorage.some((item) => item.noradCatId === row.noradCatId)) {
				currentStorage.push(row);
			}
		}
		localStorage.setItem(key, JSON.stringify(currentStorage));
		selectionError.value = "";
	} else {
		// Only unselect those visible in tableData
		const idsToUnselect = tableData.value.map((row: any) => row.noradCatId);
		const updatedStorage = currentStorage.filter((item) => !idsToUnselect.includes(item.noradCatId));

		for (const id of idsToUnselect) {
			selectedIds.value.delete(id);
		}
		localStorage.setItem(key, JSON.stringify(updatedStorage));
		selectionError.value = "";
	}
};

const selectedType = ref<string | null>(null);

const objectTypeCounts = computed(() => {
	const counts: Record<string, number> = {};
	for (const item of rawData.value) {
		counts[item.objectType] = (counts[item.objectType] || 0) + 1;
	}
	return counts;
});

const totalObjects = computed(() => rawData.value.length);
const handleFilteredData = (filtered: Satellite[]) => {
	tableData.value = filtered;
	// getTableData()
};
const updateWidth = () => {
	tableWidth.value = Math.max(window.innerWidth - 80, 900); // 700 is min width
}; onMounted(() => {
	getTableData();
	restoreSelectionFromStorage();

	updateWidth();
	window.addEventListener('resize', updateWidth);
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', updateWidth);
});
</script>


<template>
	<div class="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white px-6 py-8 space-y-6">
		<h1 class="text-3xl font-bold">Create My Asset List</h1>

		<div v-if="loading" class="text-2xl text-center">Loading....</div>
		<template v-else>
			<!-- Filter Tabs -->
			<div class="flex flex-wrap items-center gap-3">
				<button class="px-4 py-1 rounded-full border border-white text-sm transition" :class="{ 'bg-white text-black font-semibold': !selectedType }" @click="() => { selectedType = null; filterAndSortData(); }">
					All Objects ({{ totalObjects }})
				</button>

				<button v-for="(count, type) in objectTypeCounts" :key="type" class="px-4 py-1 rounded-full border border-white text-sm transition flex items-center gap-1"
					:class="{ 'bg-white text-black font-semibold': selectedType === type }" @click="() => { selectedType = type; filterAndSortData(); }">
					{{ type }} ({{ count }})
				</button>
			</div>

			<!-- Search & Action -->
			<div class="flex flex-col md:flex-row md:items-center  gap-4">
				<div class="relative w-full max-w-sm">
					<input v-model="searchQuery" type="text" class="w-full rounded-full px-4 py-2 bg-gray-800 text-white border border-gray-600 placeholder-gray-400" placeholder="Search by name / NORAD ID" @keydown="handleKeyPress" />
					<button v-if="searchQuery" @click="clearSearch" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
						&times;
					</button>
					<!-- Filter UI -->

				</div>
				<BaseFilter :data="rawData" @filter="handleFilteredData" />
			</div>


			<div v-if="selectedIds.size > 0" class="flex items-center gap-3">
				<span class="text-sm">Selected: <strong>{{ selectedIds.size }}</strong></span>
				<span v-if="selectionError" class="text-red-500 text-sm">{{ selectionError }}</span>
				<el-button type="primary" @click=" navigateTo('/item')">Proceed</el-button>
			</div>

			<!-- Table -->
			<div class="w-full overflow-x-auto px-4">
				<div class="min-w-[700px] max-w-full">
					<el-table-v2 :columns="columns" :data="tableData" :height="500" :width="Math.max(tableWidth, 700)" fixed :row-height="40" class="text-sm w-full">
						<!-- header cell slot -->
						<template #header-cell="{ column }">
							<template v-if="column.key === 'select'">
								<input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected" class="accent-blue-500" />
							</template>
							<template v-else>
								<div class="flex items-center cursor-pointer hover:text-blue-400 transition" @click="handleHeaderClick(column)">
									{{ column.title }}
									<span v-if="sortKey === column.key">
										{{ sortDirection === 'asc' ? '▲' : '▼' }}
									</span>
								</div>
							</template>
						</template>

						<!-- cell slot -->
						<template #cell="{ column, rowData }">
							<template v-if="column.key === 'select'">
								<input type="checkbox" :checked="isSelected(rowData.noradCatId)" @change="onCheckboxChange($event, rowData)" class="accent-blue-500" />
							</template>
						</template>
					</el-table-v2>
				</div>
			</div>
		</template>
	</div>
</template>


<style scoped>
::deep(.el-table-v2__header),
:deep(.el-table-v2__row),
:deep(.el-table-v2__cell) {
	background-color: #0f111a !important;
	/* dark bg */
	color: #ffffff !important;
	/* white text */
	border-color: #2c2c2c !important;
}

:deep(.el-table-v2__body) {
	background-color: #0f111a !important;
}

:deep(.el-table-v2__row:hover) {
	background-color: #1c1c1c !important;
	/* optional dark hover background */
	color: #ffffff !important;
}

:deep(.el-table-v2__row:hover .el-table-v2__cell) {
	color: #ffffff !important;
}
</style>
