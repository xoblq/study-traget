<template>
  <header class="toolbar">
    <div class="toolbar-left">
      <select :value="currentModel" @change="$emit('update:model', $event.target.value)" class="select">
        <option v-for="m in models" :key="m.id" :value="m.id">
          {{ m.name }}
        </option>
      </select>
      <button 
        @click="$emit('toggleAgent')" 
        class="btn-agent"
        :class="{ active: isAgentMode }"
        title="Agent 模式（可调用工具）"
      >
        Agent
      </button>
    </div>
    <div class="toolbar-right">
      <ThemeToggle />
      <button @click="$emit('togglePrompt')" class="btn-icon" title="系统提示词">
        <el-icon><Setting /></el-icon>
      </button>
      <button @click="$emit('clear')" class="btn-icon" title="清空对话">
        <el-icon><Delete /></el-icon>
      </button>
    </div>
  </header>
</template>

<script setup>
import { Setting, Delete } from '@element-plus/icons-vue'
import ThemeToggle from './ThemeToggle.vue'

defineProps({
  models: Array,
  currentModel: String,
  isAgentMode: Boolean
})

defineEmits(['update:model', 'clear', 'togglePrompt', 'toggleAgent'])
</script>

<style scoped>
.toolbar {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-secondary);
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.select {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  padding-right: 32px;
}

:root.light .select {
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
}

.select:focus {
  outline: none;
  border-color: var(--accent);
}

.select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-agent {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-agent:hover {
  border-color: var(--text-primary);
  color: var(--text-primary);
}

.btn-agent.active {
  background: var(--text-primary);
  color: var(--bg-primary);
  border-color: var(--text-primary);
}

.btn-icon {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
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
</style>
