<template>
  <div class="app">
    <Sidebar :conversations="conversations" :currentId="currentConversationId" @new="newChat" @select="loadConversation"
      @delete="deleteConversation" />

    <main class="main" @dragenter.prevent="onDragEnter" @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop">
      <!-- 拖拽提示 -->
      <div v-if="showDropZone" class="drop-zone">
        <div class="drop-zone-content">
          <el-icon class="upload-icon"><Upload /></el-icon>
          <p>释放文件以上传</p>
          <span>支持图片、PDF、Word 文件</span>
        </div>
      </div>

      <Toolbar :models="models" :currentModel="currentModel" :isAgentMode="isAgentMode"
        @update:model="currentModel = $event" @clear="clearChat" @togglePrompt="showPromptPanel = !showPromptPanel"
        @toggleAgent="isAgentMode = !isAgentMode" />

      <PromptPanel v-if="showPromptPanel" :value="systemPrompt" @apply="applySystemPrompt"
        @close="showPromptPanel = false" />

      <!-- 工具调用提示 -->
      <div v-if="toolCalls.length > 0" class="tool-calls">
        <div v-for="(tool, index) in toolCalls" :key="index" class="tool-call">
          <span class="tool-icon"></span>
          <span class="tool-name">调用工具: {{ tool.name }}</span>
        </div>
      </div>

      <ChatArea :messages="messages" ref="chatArea" />

      <!-- 图片预览 -->
      <ImagePreview v-if="imageFile" :file="imageFile" :previewUrl="imagePreviewUrl" @remove="removeImage" />

      <!-- 文件预览 -->
      <FilePreview v-if="uploadedFile" :file="uploadedFile" @remove="removeFile" />

      <InputArea :disabled="isGenerating" @send="sendMessage" @uploadFile="handleFileUpload" @stop="stopGeneration" />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import Sidebar from './components/Sidebar.vue'
import Toolbar from './components/Toolbar.vue'
import PromptPanel from './components/PromptPanel.vue'
import ChatArea from './components/ChatArea.vue'
import FilePreview from './components/FilePreview.vue'
import ImagePreview from './components/ImagePreview.vue'
import InputArea from './components/InputArea.vue'
import { getModels, chatStream } from './api/chat.js'
import { getConversations, saveConversation, loadConversation as loadConv, deleteConversation as delConv } from './api/conversation.js'
import { uploadFile, analyzeDocument } from './api/upload.js'
import { uploadImage, analyzeImage } from './api/image.js'
import { agentChat } from './api/agent.js'

const models = ref([])
const currentModel = ref('qwen-plus')
const conversations = ref([])
const currentConversationId = ref(null)
const messages = ref([])
const systemPrompt = ref('')
const showPromptPanel = ref(false)

// Agent 模式
const isAgentMode = ref(false)
const toolCalls = ref([])

// 文件相关
const uploadedFile = ref(null)
const uploadedText = ref(null)

// 图片相关
const imageFile = ref(null)
const imagePreviewUrl = ref(null)
const imageBase64 = ref(null)

const isGenerating = ref(false)
const chatArea = ref(null)

// 拖拽相关
const showDropZone = ref(false)
let dragCounter = 0

// 中断控制器
let abortController = null

onMounted(async () => {
  await loadModels()
  await loadConversations()
})

async function loadModels() {
  models.value = await getModels()
}

async function loadConversations() {
  conversations.value = await getConversations()
}

async function loadConversation(id) {
  const data = await loadConv(id)
  currentConversationId.value = id
  messages.value = data.messages || []
  systemPrompt.value = data.systemPrompt || ''
  currentModel.value = data.model || 'qwen-plus'
  isAgentMode.value = data.isAgentMode || false
  loadConversations()
}

async function deleteConversation(id) {
  try {
    await ElMessageBox.confirm('确定要删除这个对话吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  await delConv(id)
  if (currentConversationId.value === id) {
    newChat()
  }
  loadConversations()
}

async function save() {
  if (messages.value.length === 0) return
  const data = await saveConversation({
    id: currentConversationId.value,
    messages: messages.value,
    systemPrompt: systemPrompt.value,
    model: currentModel.value,
    isAgentMode: isAgentMode.value
  })
  currentConversationId.value = data.id
  loadConversations()
}

// 拖拽处理
function onDragEnter(e) {
  e.preventDefault()
  dragCounter++
  showDropZone.value = true
}

function onDragOver(e) {
  e.preventDefault()
}

function onDragLeave(e) {
  e.preventDefault()
  dragCounter--
  if (dragCounter === 0) {
    showDropZone.value = false
  }
}

function onDrop(e) {
  e.preventDefault()
  dragCounter = 0
  showDropZone.value = false

  const files = e.dataTransfer.files
  if (files.length > 0) {
    const file = files[0]
    console.log('拖拽文件:', file.name, file.type, file.size)

    // 根据扩展名判断类型
    const ext = file.name.split('.').pop().toLowerCase()

    if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      if (file.size > 20 * 1024 * 1024) {
        ElMessage.warning('图片大小不能超过 20MB')
        return
      }
      handleImageUpload(file)
    } else if (['pdf', 'docx', 'doc'].includes(ext)) {
      if (file.size > 10 * 1024 * 1024) {
        ElMessage.warning('文件大小不能超过 10MB')
        return
      }
      handleFileUpload(file)
    } else {
      ElMessage.warning('支持的文件格式：图片、PDF、Word')
    }
  }
}

function isImageFile(file) {
  return file.type.startsWith('image/')
}

function isDocFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  return ['pdf', 'docx', 'doc'].includes(ext)
}

function newChat() {
  messages.value = []
  currentConversationId.value = null
  toolCalls.value = []
  removeFile()
  removeImage()
}

async function clearChat() {
  if (messages.value.length === 0) return
  try {
    await ElMessageBox.confirm('确定要清空当前对话吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  newChat()
}

function applySystemPrompt(prompt) {
  systemPrompt.value = prompt
  showPromptPanel.value = false
}

// 停止生成
function stopGeneration() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  isGenerating.value = false
}

// 图片上传
async function handleImageUpload(file) {
  imageFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreviewUrl.value = e.target.result
  }
  reader.readAsDataURL(file)

  const result = await uploadImage(file)
  if (result.success) {
    imageBase64.value = result.base64
  } else {
    ElMessage.error(result.error)
    removeImage()
  }
}

function removeImage() {
  imageFile.value = null
  imagePreviewUrl.value = null
  imageBase64.value = null
}

// 文件上传
async function handleFileUpload(file) {
  const result = await uploadFile(file)
  if (result.success) {
    uploadedFile.value = { name: result.filename, size: result.size }
    uploadedText.value = result.text
  } else {
    ElMessage.error(result.error)
  }
}

function removeFile() {
  uploadedFile.value = null
  uploadedText.value = null
}

// 发送消息
async function sendMessage(content) {
  if (!content || isGenerating.value) return

  isGenerating.value = true
  toolCalls.value = []
  abortController = new AbortController()
  const signal = abortController.signal

  // 图片分析
  if (imageBase64.value) {
    const imgPreview = imagePreviewUrl.value

    messages.value.push({
      role: 'user',
      content: content,
      image: imgPreview
    })
    messages.value.push({ role: 'assistant', content: '' })



    await analyzeImage(
      imageBase64.value,
      content,
      signal,
      (chunk) => {
        messages.value[messages.value.length - 1].content += chunk
      },
      (fullContent) => {
        messages.value[messages.value.length - 1].content = fullContent
        save()
      },
      (error) => {
        messages.value[messages.value.length - 1].content = `错误: ${error}`
      }
    )
    // 先清空 会到这拿到的imageBase64会丢失
    removeImage()
  }
  // 文档分析
  else if (uploadedFile.value) {
    messages.value.push({ role: 'user', content: `📎 ${uploadedFile.value.name}\n${content}` })
    messages.value.push({ role: 'assistant', content: '' })

    await analyzeDocument(
      uploadedText.value,
      content,
      currentModel.value,
      signal,
      (chunk) => {
        messages.value[messages.value.length - 1].content += chunk
      },
      (fullContent) => {
        messages.value[messages.value.length - 1].content = fullContent
        save()
        removeFile()
      },
      (error) => {
        messages.value[messages.value.length - 1].content = `错误: ${error}`
      }
    )
  }
  // Agent 模式
  else if (isAgentMode.value) {
    const apiMessages = [...messages.value, { role: 'user', content }]

    messages.value.push({ role: 'user', content })
    messages.value.push({ role: 'assistant', content: '' })

    await agentChat(
      apiMessages,
      currentModel.value,
      signal,
      (chunk) => {
        messages.value[messages.value.length - 1].content += chunk
      },
      (toolCall) => {
        toolCalls.value.push(toolCall)
      },
      (fullContent) => {
        messages.value[messages.value.length - 1].content = fullContent
        toolCalls.value = []
        save()
      },
      (error) => {
        messages.value[messages.value.length - 1].content = `错误: ${error}`
        toolCalls.value = []
      }
    )
  }
  // 普通聊天
  else {
    const apiMessages = []
    if (systemPrompt.value) {
      apiMessages.push({ role: 'system', content: systemPrompt.value })
    }
    apiMessages.push(...messages.value, { role: 'user', content })

    messages.value.push({ role: 'user', content })
    messages.value.push({ role: 'assistant', content: '' })

    await chatStream(
      apiMessages,
      currentModel.value,
      signal,
      (chunk) => {
        messages.value[messages.value.length - 1].content += chunk
      },
      (fullContent) => {
        messages.value[messages.value.length - 1].content = fullContent
        save()
      },
      (error) => {
        messages.value[messages.value.length - 1].content = `错误: ${error}`
      }
    )
  }

  abortController = null
  isGenerating.value = false
}
</script>

<style scoped>
.main {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.drop-zone {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
}

.drop-zone-content {
  text-align: center;
  color: var(--text-primary);
}

.upload-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.drop-zone-content p {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 8px;
}

.drop-zone-content span {
  font-size: 14px;
  color: var(--text-secondary);
}

.tool-calls {
  padding: 8px 40px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid var(--border);
}

.tool-call {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.tool-icon {
  font-size: 14px;
}

.tool-name {
  color: var(--accent);
}
</style>
