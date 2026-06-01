<template>
  <div class="file-preview">
    <div class="file-preview-content">
      <el-icon class="file-icon"><Document /></el-icon>
      <div class="file-info">
        <span class="file-name">{{ file.name }}</span>
        <span class="file-size">{{ formatSize(file.size) }}</span>
      </div>
      <button @click="$emit('remove')" class="btn-remove" title="移除文件">
        <el-icon><Close /></el-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { Document, Close } from '@element-plus/icons-vue'

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

<style scoped>
.file-preview {
  margin: 0 40px 12px;
}

.file-preview-content {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-radius: 14px;
  border: 1px solid var(--border);
}

.file-icon {
  font-size: 24px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}

.file-size {
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
  font-size: 16px;
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
