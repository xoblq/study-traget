<template>
  <div class="theme-toggle" @click="toggleTheme" :title="isDark ? '切换到白天模式' : '切换到黑夜模式'">
    <div class="toggle-track" :class="{ light: !isDark }">
      <div class="toggle-thumb">
        <el-icon class="icon" :class="{ rotating: isAnimating }">
          <Moon v-if="isDark" />
          <Sunny v-else />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Moon, Sunny } from '@element-plus/icons-vue'
import { useTheme } from '../composables/useTheme.js'

const { isDark, toggleTheme: toggle } = useTheme()
const isAnimating = ref(false)

function toggleTheme() {
  isAnimating.value = true
  toggle()
  setTimeout(() => {
    isAnimating.value = false
  }, 300)
}
</script>

<style scoped>
.theme-toggle {
  cursor: pointer;
  user-select: none;
}

.toggle-track {
  width: 56px;
  height: 28px;
  background: #333333;
  border-radius: 14px;
  position: relative;
  transition: background 0.3s ease;
  border: 2px solid #444444;
}

.toggle-track.light {
  background: #e0e0e0;
  border-color: #cccccc;
}

.toggle-thumb {
  width: 24px;
  height: 24px;
  background: #ffffff;
  border-radius: 50%;
  position: absolute;
  top: 0;
  left: 0;
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-track.light .toggle-thumb {
  transform: translateX(28px);
  background: #ffffff;
}

.icon {
  font-size: 14px;
  color: #333333;
  transition: transform 0.3s ease;
}

.icon.rotating {
  animation: rotate 0.3s ease;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.theme-toggle:hover .toggle-thumb {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.theme-toggle:active .toggle-thumb {
  width: 28px;
}
</style>
