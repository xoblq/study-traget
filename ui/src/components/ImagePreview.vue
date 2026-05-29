<template>
  <div class="image-preview">
    <div class="image-preview-content">
      <img :src="previewUrl" :alt="file.name" class="preview-thumb" />
      <div class="preview-info">
        <span class="preview-name">{{ file.name }}</span>
        <span class="preview-size">{{ formatSize(file.size) }}</span>
      </div>
      <button @click="$emit('remove')" class="btn-remove" title="移除图片">&times;</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  file: Object,
  previewUrl: String
})

defineEmits(['remove'])

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
.image-preview {
  margin: 0 40px 12px;
}

.image-preview-content {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-radius: 14px;
  border: 1px solid var(--border);
}

.preview-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid var(--border);
}

.preview-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.preview-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}

.preview-size {
  font-size: 12px;
  color: var(--text-secondary);
}

.btn-remove {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: none;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: var(--error);
  border-color: var(--error);
  color: white;
}
</style>
