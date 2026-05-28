<template>
  <div class="file-info">
    <div class="file-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
      </svg>
    </div>
    <div class="file-details">
      <span class="file-name">{{ file.name }}</span>
      <span class="file-size">{{ formatSize(file.size) }}</span>
    </div>
    <button @click="$emit('remove')" class="btn-icon" title="移除文件">&times;</button>
  </div>
</template>

<script setup>
defineProps({
  file: Object
})

defineEmits(['remove'])

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>
