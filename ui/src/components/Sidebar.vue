<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>AI Chat</h2>
      <button @click="$emit('new')" class="btn-primary">新对话</button>
    </div>
    <div class="conversation-list">
      <div
        v-for="conv in conversations"
        :key="conv.id"
        class="conversation-item"
        :class="{ active: conv.id === currentId }"
        @click="$emit('select', conv.id)"
      >
        <span class="title">{{ conv.title }}</span>
        <button class="delete-btn" @click.stop="$emit('delete', conv.id)">&times;</button>
      </div>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  conversations: Array,
  currentId: String
})

defineEmits(['new', 'select', 'delete'])
</script>

<style scoped>
.sidebar {
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.btn-primary {
  background: var(--text-primary);
  color: var(--bg-primary);
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--text-secondary);
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.conversation-item {
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-secondary);
}

.conversation-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.conversation-item.active {
  background: var(--text-primary);
  color: var(--bg-primary);
}

.conversation-item .title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-item .delete-btn {
  opacity: 0;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 4px;
  font-size: 16px;
}

.conversation-item:hover .delete-btn {
  opacity: 0.7;
}

.conversation-item:hover .delete-btn:hover {
  opacity: 1;
}

.conversation-item.active .delete-btn {
  opacity: 0.5;
}

.conversation-item.active .delete-btn:hover {
  opacity: 1;
}
</style>
