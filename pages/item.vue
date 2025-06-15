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

const savedSatellites = ref<Satellite[]>([]);

onMounted(() => {
	const data = localStorage.getItem("selectedSatellites");
	if (data) {
		try {
			savedSatellites.value = JSON.parse(data) as Satellite[];
		} catch (err) {
			console.error("Invalid localStorage data:", err);
		}
	}
});
</script>

<template>
	<div class="p-4">
		<h2 class="text-lg font-bold mb-4">My Selected Satellites</h2>

		<ul v-if="savedSatellites.length > 0" class="space-y-2">
			<li v-for="sat in savedSatellites" :key="sat.noradCatId" class="border p-2 rounded">
				<span class="font-medium">Name:</span> {{ sat.name }} |
				<span class="font-medium">NORAD ID:</span> {{ sat.noradCatId }}
			</li>
		</ul>

		<p v-else class="text-gray-500">No satellites selected yet.</p>
	</div>
</template>
