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
        <span>支持图片、PDF、Word 文件</span>
      </div>
    </div>

    <div class="input-wrapper" :class="{ 'drag-over': isDragOver }">
      <button @click="triggerFileInput" class="btn-upload" title="上传文件">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
        </svg>
      </button>
      <textarea
        ref="inputRef"
        v-model="input"
        @keydown.enter.exact.prevent="send"
        placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
        rows="1"
        @input="autoResize"
      ></textarea>
      <button @click="send" class="btn-send" :disabled="!canSend">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
      </button>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*,.pdf,.doc,.docx"
      @change="onFileSelect"
      style="display: none"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  disabled: Boolean
})

const emit = defineEmits(['send', 'uploadImage', 'uploadFile'])

const input = ref('')
const inputRef = ref(null)
const fileInputRef = ref(null)
const isDragOver = ref(false)
const showDropZone = ref(false)
let dragCounter = 0

const canSend = computed(() => {
  return input.value.trim() && !props.disabled
})

function triggerFileInput() {
  fileInputRef.value.click()
}

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

function isImageFile(file) {
  return file.type.startsWith('image/')
}

function isDocFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  return ['pdf', 'docx', 'doc'].includes(ext)
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
    handleFile(files[0])
  }
}

function onFileSelect(e) {
  const files = e.target.files
  if (files.length > 0) {
    handleFile(files[0])
  }
  e.target.value = ''
}

function handleFile(file) {
  if (isImageFile(file)) {
    if (file.size > 20 * 1024 * 1024) {
      alert('图片大小不能超过 20MB')
      return
    }
    emit('uploadImage', file)
  } else if (isDocFile(file)) {
    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过 10MB')
      return
    }
    emit('uploadFile', file)
  } else {
    alert('支持的文件格式：图片、PDF、Word')
  }
}
</script>

<style scoped>
.input-area {
  padding: 20px 40px 28px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  position: relative;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  background: var(--bg-tertiary);
  border-radius: 16px;
  padding: 12px 16px;
  border: 1px solid var(--border);
  transition: all 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.input-wrapper.drag-over {
  border-color: var(--accent);
  background: rgba(79, 70, 229, 0.05);
}

.input-wrapper textarea {
  flex: 1;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 15px;
  resize: none;
  max-height: 200px;
  line-height: 1.6;
  font-family: inherit;
}

.input-wrapper textarea:focus {
  outline: none;
}

.input-wrapper textarea::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

.btn-upload {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: none;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-upload:hover {
  background: var(--bg-primary);
  border-color: var(--accent);
  color: var(--accent);
}

.btn-send {
  background: var(--accent);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.btn-send:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.drop-zone {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(79, 70, 229, 0.1);
  border: 2px dashed var(--accent);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

.drop-zone-content {
  text-align: center;
  color: var(--accent);
}

.drop-zone-content svg {
  margin-bottom: 12px;
}

.drop-zone-content p {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.drop-zone-content span {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
