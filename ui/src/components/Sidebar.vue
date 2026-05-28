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
