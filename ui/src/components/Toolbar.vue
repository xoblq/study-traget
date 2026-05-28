<template>
  <header class="toolbar">
    <div class="toolbar-left">
      <select :value="currentModel" @change="$emit('update:model', $event.target.value)" class="select">
        <option v-for="m in models" :key="m.id" :value="m.id">
          {{ m.name }}
        </option>
      </select>
    </div>
    <div class="toolbar-right">
      <button @click="$emit('togglePrompt')" class="btn-icon" title="系统提示词">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
      </button>
      <button @click="$emit('clear')" class="btn-icon" title="清空对话">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  models: Array,
  currentModel: String
})

defineEmits(['update:model', 'clear', 'togglePrompt'])
</script>
