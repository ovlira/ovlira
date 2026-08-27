<script setup lang="ts">
import { onMounted, ref } from 'vue'
import 'ovlira/components/button.js'
import 'ovlira/components/select.js'

const select = ref<HTMLElement & { options: { value: string; label: string }[] }>()
onMounted(() => {
  select.value!.options = [
    { value: 'eu', label: 'Europe' },
    { value: 'us', label: 'United States' },
  ]
})
</script>

<template>
  <ov-button variant="primary" @click="console.log('save')">Save</ov-button>
  <ov-select ref="select" label="Region" />
</template>
