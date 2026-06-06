<template>
  <div class="input-area">
    <div class="input-wrapper">
      <button @click="triggerFileInput" class="btn-upload" title="上传文件">
        <el-icon><Paperclip /></el-icon>
      </button>
      <textarea
        ref="inputRef"
        v-model="input"
        @keydown.enter.exact.prevent="send"
        @paste="onPaste"
        placeholder="输入消息... (Enter 发送, Shift+Enter 换行，可拖拽文件到任意位置上传，支持粘贴图片)"
        rows="1"
        @input="autoResize"
        :disabled="disabled"
      ></textarea>
      <!-- 暂停按钮 -->
      <button v-if="disabled" @click="$emit('stop')" class="btn-stop" title="停止生成">
        <el-icon><VideoPause /></el-icon>
      </button>
      <!-- 发送按钮 -->
      <button v-else @click="send" class="btn-send" :disabled="!canSend">
        <el-icon><Promotion /></el-icon>
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
import { Paperclip, VideoPause, Promotion } from '@element-plus/icons-vue'

const props = defineProps({
  disabled: Boolean
})

const emit = defineEmits(['send', 'uploadImage', 'uploadFile', 'stop'])

const input = ref('')
const inputRef = ref(null)
const fileInputRef = ref(null)

const canSend = computed(() => {
  return input.value.trim() && !props.disabled
})

function triggerFileInput() {
  fileInputRef.value.click()
}

function send() {
  if (input.value.trim() && !props.disabled) {
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

function onFileSelect(e) {
  const files = e.target.files
  if (files.length > 0) {
    const file = files[0]
    if (file.type.startsWith('image/')) {
      emit('uploadImage', file)
    } else {
      emit('uploadFile', file)
    }
  }
  e.target.value = ''
}

/**
 * 处理粘贴事件，支持直接粘贴图片和文件
 * @param {ClipboardEvent} e 粘贴事件对象
 */
function onPaste(e) {
  const items = e.clipboardData?.items
  if (!items) return

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) {
        if (file.type.startsWith('image/')) {
          e.preventDefault()
          emit('uploadImage', file)
        } else {
          e.preventDefault()
          emit('uploadFile', file)
        }
      }
    }
  }
}
</script>

<style scoped>
.input-area {
  padding: 20px 40px 28px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
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
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

:root.light .input-wrapper:focus-within {
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
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

.input-wrapper textarea:disabled {
  opacity: 0.7;
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
  font-size: 18px;
}

.btn-upload:hover {
  background: var(--bg-primary);
  border-color: var(--accent);
  color: var(--accent);
}

.btn-send {
  background: var(--text-primary);
  border: none;
  color: var(--bg-primary);
  width: 40px;
  height: 40px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  font-size: 18px;
}

.btn-send:hover:not(:disabled) {
  background: var(--text-secondary);
}

.btn-send:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-stop {
  background: var(--text-primary);
  border: none;
  color: var(--bg-primary);
  width: 40px;
  height: 40px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  animation: pulse 1.5s infinite;
  font-size: 18px;
}

.btn-stop:hover {
  background: var(--text-secondary);
  transform: scale(1.05);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
</style>
