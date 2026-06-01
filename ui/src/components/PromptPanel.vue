<template>
  <div class="panel">
    <div class="panel-header">
      <h3>系统提示词</h3>
      <button @click="$emit('close')" class="btn-icon">
        <el-icon><Close /></el-icon>
      </button>
    </div>
    <textarea
      v-model="prompt"
      placeholder="设置 AI 的角色和行为，例如：你是一个专业的编程助手..."
    ></textarea>
    <div class="panel-actions">
      <button @click="$emit('apply', prompt)" class="btn-primary">应用</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Close } from '@element-plus/icons-vue'

const props = defineProps({
  value: String
})

defineEmits(['apply', 'close'])

const prompt = ref(props.value)
</script>

<style scoped>
.panel {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 20px 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-header h3 {
  font-size: 16px;
  color: var(--text-primary);
}

.btn-icon {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.btn-icon:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.panel textarea {
  width: 100%;
  min-height: 100px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.panel textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.panel textarea::placeholder {
  color: var(--text-secondary);
}

.panel-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  background: var(--accent);
  color: var(--bg-primary);
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--accent-hover);
}
</style>
