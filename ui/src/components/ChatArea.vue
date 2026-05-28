<template>
  <div class="chat-container">
    <div class="chat-messages" ref="messagesRef">
      <div v-if="messages.length === 0" class="welcome-message">
        <h1>AI Chat</h1>
        <p>开始一个新的对话吧</p>
      </div>
      <div
        v-for="(msg, index) in displayMessages"
        :key="index"
        class="message"
        :class="msg.role"
      >
        <div class="message-avatar">
          {{ msg.role === 'user' ? 'U' : 'AI' }}
        </div>
        <div
          class="message-content"
          :class="{ 'markdown-body': msg.role === 'assistant' }"
          v-html="renderContent(msg.content, msg.role)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'

const props = defineProps({
  messages: Array
})

const messagesRef = ref(null)

// 配置 marked
marked.use({
  renderer: {
    code(args) {
      // 新版 marked 传入的是对象参数
      const text = args.text || args
      const lang = args.lang || ''
      
      let highlighted
      try {
        if (lang && hljs.getLanguage(lang)) {
          highlighted = hljs.highlight(String(text), { language: lang }).value
        } else {
          highlighted = hljs.highlightAuto(String(text)).value
        }
      } catch (e) {
        highlighted = escapeHtml(String(text))
      }
      
      return `<pre><code class="hljs language-${lang || 'auto'}">${highlighted}</code></pre>`
    }
  },
  breaks: true,
  gfm: true
})

const displayMessages = computed(() => {
  return props.messages.filter(m => m.role !== 'system')
})

watch(displayMessages, () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}, { deep: true })

function renderContent(content, role) {
  if (!content) return ''
  
  if (role === 'user') {
    return escapeHtml(content).replace(/\n/g, '<br>')
  }
  
  return marked(String(content))
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = String(text)
  return div.innerHTML
}
</script>
