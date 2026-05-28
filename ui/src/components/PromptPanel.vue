<template>
  <div class="panel">
    <div class="panel-header">
      <h3>系统提示词</h3>
      <button @click="$emit('close')" class="btn-icon">&times;</button>
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

const props = defineProps({
  value: String
})

defineEmits(['apply', 'close'])

const prompt = ref(props.value)
</script>
