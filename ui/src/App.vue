<template>
  <div class="app">
    <Sidebar :conversations="conversations" :currentId="currentConversationId" @new="newChat" @select="loadConversation"
      @delete="deleteConversation" />

    <main class="main">
      <Toolbar 
        :models="models" 
        :currentModel="currentModel" 
        :isAgentMode="isAgentMode"
        @update:model="currentModel = $event" 
        @clear="clearChat"
        @togglePrompt="showPromptPanel = !showPromptPanel"
        @toggleAgent="isAgentMode = !isAgentMode"
      />

      <PromptPanel v-if="showPromptPanel" :value="systemPrompt" @apply="applySystemPrompt"
        @close="showPromptPanel = false" />

      <!-- 工具调用提示 -->
      <div v-if="toolCalls.length > 0" class="tool-calls">
        <div v-for="(tool, index) in toolCalls" :key="index" class="tool-call">
          <span class="tool-icon">🔧</span>
          <span class="tool-name">调用工具: {{ tool.name }}</span>
        </div>
      </div>

      <ChatArea :messages="messages" ref="chatArea" />

      <!-- 图片预览 -->
      <ImagePreview v-if="imageFile" :file="imageFile" :previewUrl="imagePreviewUrl" @remove="removeImage" />

      <!-- 文件预览 -->
      <FilePreview v-if="uploadedFile" :file="uploadedFile" @remove="removeFile" />

      <InputArea :disabled="isGenerating" @send="sendMessage" @uploadImage="handleImageUpload"
        @uploadFile="handleFileUpload" />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
  if (!confirm('确定要删除这个对话吗？')) return
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

function newChat() {
  messages.value = []
  currentConversationId.value = null
  toolCalls.value = []
  removeFile()
  removeImage()
}

function clearChat() {
  if (messages.value.length === 0) return
  if (confirm('确定要清空当前对话吗？')) {
    newChat()
  }
}

function applySystemPrompt(prompt) {
  systemPrompt.value = prompt
  showPromptPanel.value = false
}

// 图片上传
async function handleImageUpload(file) {
  imageFile.value = file

  // 本地预览
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreviewUrl.value = e.target.result
  }
  reader.readAsDataURL(file)

  // 上传获取 base64
  const result = await uploadImage(file)
  if (result.success) {
    imageBase64.value = result.base64
  } else {
    alert(result.error)
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
    alert(result.error)
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

  // 图片分析
  if (imageBase64.value) {
    const imgPreview = imagePreviewUrl.value

    messages.value.push({
      role: 'user',
      content: content,
      image: imgPreview
    })
    messages.value.push({ role: 'assistant', content: '' })

    removeImage()

    await analyzeImage(
      imageBase64.value,
      content,
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
  // 文档分析
  else if (uploadedFile.value) {
    messages.value.push({ role: 'user', content: `📎 ${uploadedFile.value.name}\n${content}` })
    messages.value.push({ role: 'assistant', content: '' })

    await analyzeDocument(
      uploadedText.value,
      content,
      currentModel.value,
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

  isGenerating.value = false
}
</script>

<style scoped>
.tool-calls {
  padding: 8px 40px;
  background: rgba(79, 70, 229, 0.1);
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
