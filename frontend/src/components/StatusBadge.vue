<template>
  <span class="status-badge" :class="cls">{{ label }}</span>
</template>

<script setup>
defineProps({
  cls: { type: String, required: true },
  label: { type: String, required: true },
})
</script>
