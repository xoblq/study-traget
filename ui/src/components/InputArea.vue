<template>
  <div
    class="input-area"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div v-if="showDropZone" class="drop-zone">
      <div class="drop-zone-content">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
        <p>释放文件以上传</p>
        <span>支持 PDF、Word 文件</span>
      </div>
    </div>

    <div class="input-wrapper" :class="{ 'drag-over': isDragOver }">
      <textarea
        ref="inputRef"
        v-model="input"
        @keydown.enter.exact.prevent="send"
        placeholder="输入消息... (Enter 发送, Shift+Enter 换行，拖拽文件到此处上传)"
        rows="1"
        @input="autoResize"
      ></textarea>
      <button @click="send" class="btn-send">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['send', 'upload'])

const input = ref('')
const inputRef = ref(null)
const isDragOver = ref(false)
const showDropZone = ref(false)
let dragCounter = 0

function send() {
  if (input.value.trim()) {
    emit('send', input.value.trim())
    input.value = ''
    autoResize()
  }
}

function autoResize() {
  const el = inputRef.value
  if (el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }
}

function onDragEnter(e) {
  dragCounter++
  showDropZone.value = true
  isDragOver.value = true
}

function onDragOver(e) {
  isDragOver.value = true
}

function onDragLeave(e) {
  dragCounter--
  if (dragCounter === 0) {
    showDropZone.value = false
    isDragOver.value = false
  }
}

function onDrop(e) {
  dragCounter = 0
  showDropZone.value = false
  isDragOver.value = false

  const files = e.dataTransfer.files
  if (files.length > 0) {
    const file = files[0]
    const ext = file.name.split('.').pop().toLowerCase()
    if (['pdf', 'docx', 'doc'].includes(ext)) {
      if (file.size <= 10 * 1024 * 1024) {
        emit('upload', file)
      } else {
        alert('文件大小不能超过 10MB')
      }
    } else {
      alert('只支持 PDF 和 Word 文件')
    }
  }
}
</script>
