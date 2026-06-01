<template>
  <div class="chat-container">
    <div class="chat-messages" ref="messagesRef">
      <div v-if="messages.length === 0" class="welcome-message">
        <h1>AI Chat</h1>
        <p>开始一个新的对话吧</p>
      </div>
      <div v-for="(msg, index) in displayMessages" :key="index" class="message" :class="msg.role">
        <div class="message-avatar">
          {{ msg.role === 'user' ? 'U' : 'AI' }}
        </div>
        <div class="message-body">
          <!-- 图片消息 -->
          <div v-if="msg.image" class="message-image">
            <img :src="msg.image" alt="用户上传的图片" />
          </div>
          <!-- 文本内容 -->
          <div class="message-content" :class="{ 'markdown-body': msg.role === 'assistant' }"
            v-html="renderContent(msg.content, msg.role)"></div>
        </div>
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
  breaks: false,
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
    // 用户消息：只转义 HTML，保留原始换行
    return escapeHtml(content).replace(/\n/g, '<br>')

  }

  // AI 消息：使用 markdown 渲染
  return marked(String(content))
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = String(text)
  return div.innerHTML
}
</script>

<style scoped>
.chat-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-message {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--text-secondary);
}

.welcome-message h1 {
  font-size: 32px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.message {
  display: flex;
  gap: 16px;
  width: 100%;
  padding: 0 20px;
}

.message.assistant {
  justify-content: flex-start;
}

.message.user {
  justify-content: flex-end;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: var(--user-msg);
  order: 1;
}

.message.assistant .message-avatar {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.message-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 75%;
}

.message.user .message-body {
  align-items: flex-end;
}

.message-image img {
  max-width: 300px;
  max-height: 300px;
  border-radius: 12px;
  border: 2px solid var(--border);
  object-fit: cover;
}

.message-content {
  padding: 14px 18px;
  border-radius: 16px;
  line-height: 1.7;
  word-break: break-word;
  white-space: pre-wrap;
  min-width: 50px;
}

.message.assistant .message-content {
  background: var(--bg-tertiary);
  border-top-left-radius: 4px;
}

.message.user .message-content {
  background: var(--user-msg);
  border-top-right-radius: 4px;
}

/* Markdown 样式 */
.markdown-body :deep(h1) {
  font-size: 20px;
  font-weight: 600;
  margin: 10px 0 6px 0;
  color: var(--accent);
  border-bottom: 1px solid var(--border);
  padding-bottom: 4px;
}

.markdown-body :deep(h2) {
  font-size: 18px;
  font-weight: 600;
  margin: 8px 0 4px 0;
  color: var(--accent);
}

.markdown-body :deep(h3) {
  font-size: 16px;
  font-weight: 600;
  margin: 6px 0 3px 0;
}

.markdown-body :deep(h4) {
  font-size: 14px;
  font-weight: 600;
  margin: 4px 0 2px 0;
}

.markdown-body :deep(p) {
  margin: 2px 0;
}

.markdown-body :deep(strong) {
  color: #ffffff;
  font-weight: 600;
}

.markdown-body :deep(em) {
  color: #cccccc;
  font-style: italic;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 2px 0;
  padding-left: 20px;
}

.markdown-body :deep(li) {
  margin: 1px 0;
}

.markdown-body :deep(ul li) {
  list-style-type: disc;
}

.markdown-body :deep(ol li) {
  list-style-type: decimal;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid var(--accent);
  padding: 4px 12px;
  margin: 6px 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0 6px 6px 0;
  color: var(--text-secondary);
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 8px 0;
}

.markdown-body :deep(a) {
  color: #ffffff;
  text-decoration: underline;
}

.markdown-body :deep(a:hover) {
  color: #cccccc;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 12px 0;
  width: 100%;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--border);
  padding: 8px 12px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: var(--bg-tertiary);
  font-weight: 600;
}

.markdown-body :deep(tr:nth-child(even)) {
  background: rgba(255, 255, 255, 0.02);
}

.markdown-body :deep(pre) {
  background: #282c34;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
  border-radius: 0;
  font-size: 14px;
  line-height: 1.6;
}

.markdown-body :deep(code) {
  background: rgba(79, 70, 229, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "Fira Code", "Consolas", monospace;
  font-size: 13px;
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 8px 0;
}

/* 滚动条 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>
