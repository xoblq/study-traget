<template>
  <header class="toolbar">
    <div class="toolbar-left">
      <select :value="currentModel" @change="$emit('update:model', $event.target.value)" class="select">
        <option v-for="m in models" :key="m.id" :value="m.id">
          {{ m.name }}
        </option>
      </select>
      <button @click="$emit('toggleAgent')" class="btn-agent" :class="{ active: isAgentMode }" title="Agent 模式（可调用工具）">
        Agent
      </button>
    </div>
    <div class="toolbar-right">
      <button @click="$emit('togglePrompt')" class="btn-icon" title="系统提示词">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
        </svg>
      </button>
      <button @click="$emit('clear')" class="btn-icon" title="清空对话">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup>
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
  gap: 8px;
}

.select {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.select:focus {
  outline: none;
  border-color: var(--accent);
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
  border-color: var(--accent);
  color: var(--accent);
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
}

.btn-icon:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
</style>
