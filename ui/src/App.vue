<template>
  <div class="app">
    <Sidebar
      :conversations="conversations"
      :currentId="currentConversationId"
      @new="newChat"
      @select="loadConversation"
      @delete="deleteConversation"
    />

    <main class="main">
      <Toolbar
        :models="models"
        :currentModel="currentModel"
        @update:model="currentModel = $event"
        @clear="clearChat"
        @togglePrompt="showPromptPanel = !showPromptPanel"
      />

      <PromptPanel
        v-if="showPromptPanel"
        :value="systemPrompt"
        @apply="applySystemPrompt"
        @close="showPromptPanel = false"
      />

      <ChatArea :messages="messages" ref="chatArea" />

      <FilePreview
        v-if="uploadedFile"
        :file="uploadedFile"
        @remove="removeFile"
      />

      <InputArea
        @send="sendMessage"
        @upload="handleUpload"
      />
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
import InputArea from './components/InputArea.vue'
import { getModels, chatStream } from './api/chat.js'
import { getConversations, saveConversation, loadConversation as loadConv, deleteConversation as delConv } from './api/conversation.js'
import { uploadFile, analyzeDocument } from './api/upload.js'

const models = ref([])
const currentModel = ref('qwen-plus')
const conversations = ref([])
const currentConversationId = ref(null)
const messages = ref([])
const systemPrompt = ref('')
const showPromptPanel = ref(false)
const uploadedFile = ref(null)
const uploadedText = ref(null)
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
    model: currentModel.value
  })
  currentConversationId.value = data.id
  loadConversations()
}

function newChat() {
  messages.value = []
  currentConversationId.value = null
  removeFile()
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

async function handleUpload(file) {
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

async function sendMessage(content) {
  if (!content || isGenerating.value) return

  isGenerating.value = true

  if (uploadedFile.value) {
    messages.value.push({ role: 'user', content: `📎 ${uploadedFile.value.name}\n${content}` })
    messages.value.push({ role: 'assistant', content: '' })

    await analyzeDocument(
      uploadedText.value,
      content,
      currentModel.value,
      (chunk) => {
        messages.value[messages.value.length - 1].content += chunk
      },
      (fullContent, usage) => {
        messages.value[messages.value.length - 1].content = fullContent
        save()
        removeFile()
      },
      (error) => {
        messages.value[messages.value.length - 1].content = `错误: ${error}`
      }
    )
  } else {
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
      (fullContent, usage) => {
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
