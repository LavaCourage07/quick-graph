<template>
  <div v-if="visible" class="bubble-input-overlay" @click="handleOverlayClick">
    <div class="bubble-input-dialog" :class="{ 'show': visible }">
      <!-- 对话框头部 -->
      <div class="dialog-header">
        <h4>{{ title }}</h4>
        <button @click="handleCancel" class="close-btn">
          ×
        </button>
      </div>

      <!-- 对话框内容 -->
      <div class="dialog-content">
        <div v-if="targetInfo" class="target-info">
          <div class="info-label">优化目标:</div>
          <div class="info-content">
            <span class="target-name">{{ targetInfo.name }}</span>
            <span class="target-type">{{ targetInfo.type }}</span>
          </div>
        </div>

        <div class="input-section">
          <label for="optimization-input" class="input-label">
            请描述您的优化想法:
          </label>
          <textarea
            id="optimization-input"
            v-model="inputValue"
            :placeholder="placeholder"
            class="optimization-textarea"
            rows="4"
            :disabled="isProcessing"
            @keydown.ctrl.enter="handleSubmit"
            @keydown.meta.enter="handleSubmit"
            ref="textareaRef"
          ></textarea>
          <div class="input-hint">
            <span class="hint-text">{{ inputHint }}</span>
            <span class="shortcut-hint">Ctrl+Enter 提交</span>
          </div>
        </div>

        <!-- 示例建议 -->
        <div v-if="suggestions.length && !inputValue.trim()" class="suggestions-section">
          <div class="suggestions-label">优化建议示例:</div>
          <div class="suggestions-list">
            <button
              v-for="suggestion in suggestions"
              :key="suggestion"
              @click="applySuggestion(suggestion)"
              class="suggestion-item"
              :disabled="isProcessing"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>

      <!-- 对话框底部 -->
      <div class="dialog-footer">
        <button 
          @click="handleCancel" 
          class="cancel-btn"
          :disabled="isProcessing"
        >
          取消
        </button>
        <button 
          @click="handleSubmit" 
          class="submit-btn"
          :disabled="!canSubmit || isProcessing"
        >
          <span v-if="isProcessing" class="processing-text">
            <div class="mini-spinner"></div>
            处理中...
          </span>
          <span v-else>确定</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '智能优化'
  },
  placeholder: {
    type: String,
    default: '请输入您的优化想法...'
  },
  targetInfo: {
    type: Object,
    default: null
  },
  isProcessing: {
    type: Boolean,
    default: false
  },
  optimizationType: {
    type: String,
    default: 'entity' // 'entity' | 'relation' | 'overall'
  }
})

const emit = defineEmits(['submit', 'cancel', 'update:visible'])

// 输入值
const inputValue = ref('')
const textareaRef = ref(null)

// 计算属性
const canSubmit = computed(() => {
  return inputValue.value.trim().length > 0
})

const inputHint = computed(() => {
  const length = inputValue.value.length
  if (length === 0) {
    return '请输入您的优化想法'
  } else if (length < 10) {
    return '建议输入更详细的描述'
  } else {
    return `已输入 ${length} 个字符`
  }
})

const suggestions = computed(() => {
  switch (props.optimizationType) {
    case 'entity':
      return [
        '优化节点的描述信息，使其更加准确和详细',
        '补充节点的英文名称和专业术语',
        '添加或完善节点的参数和特征信息',
        '修正节点名称，使其更符合行业标准'
      ]
    case 'relation':
      return [
        '优化关系的描述，明确两个节点之间的具体联系',
        '补充关系的英文名称和专业术语',
        '添加关系的参数和特征信息',
        '修正关系名称，使其更准确地表达连接含义'
      ]
    case 'overall':
      return [
        '分析整个子图的完整性和逻辑性',
        '识别可能缺失的重要节点或关系',
        '优化整体结构和信息组织',
        '提升子图的专业性和准确性'
      ]
    default:
      return []
  }
})

// 方法
const handleSubmit = () => {
  if (!canSubmit.value || props.isProcessing) return
  
  const trimmedValue = inputValue.value.trim()
  if (trimmedValue) {
    console.log('提交优化请求:', trimmedValue)
    emit('submit', trimmedValue)
  }
}

const handleCancel = () => {
  console.log('取消优化输入')
  inputValue.value = ''
  emit('cancel')
  emit('update:visible', false)
}

const handleOverlayClick = (event) => {
  // 点击遮罩层关闭对话框
  if (event.target === event.currentTarget) {
    handleCancel()
  }
}

const applySuggestion = (suggestion) => {
  inputValue.value = suggestion
  // 聚焦到文本框
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus()
      textareaRef.value.setSelectionRange(suggestion.length, suggestion.length)
    }
  })
}

// 监听visible变化，自动聚焦
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.focus()
      }
    })
  } else {
    // 对话框关闭时清空输入
    inputValue.value = ''
  }
})

// 暴露方法
defineExpose({
  focus: () => {
    if (textareaRef.value) {
      textareaRef.value.focus()
    }
  },
  clear: () => {
    inputValue.value = ''
  },
  setValue: (value) => {
    inputValue.value = value
  },
  getValue: () => inputValue.value
})
</script>

<style scoped>
.bubble-input-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.bubble-input-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  transform: scale(0.9) translateY(20px);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bubble-input-dialog.show {
  transform: scale(1) translateY(0);
  opacity: 1;
}

.dialog-header {
  padding: 20px 20px 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #333;
}

.dialog-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.target-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px solid #e9ecef;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 6px;
}

.info-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.target-name {
  background: #4068d4;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.target-type {
  background: #6c757d;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  text-transform: uppercase;
}

.input-section {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.optimization-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.optimization-textarea:focus {
  outline: none;
  border-color: #4068d4;
  box-shadow: 0 0 0 3px rgba(64, 104, 212, 0.1);
}

.optimization-textarea:disabled {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.input-hint {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
}

.hint-text {
  color: #6c757d;
}

.shortcut-hint {
  color: #4068d4;
  font-weight: 500;
}

.suggestions-section {
  margin-bottom: 16px;
}

.suggestions-label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.suggestion-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 8px 12px;
  text-align: left;
  font-size: 13px;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-item:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #4068d4;
  color: #333;
}

.suggestion-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dialog-footer {
  padding: 0 20px 20px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #f1f3f4;
  padding-top: 16px;
}

.cancel-btn,
.submit-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.cancel-btn {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #e9ecef;
}

.cancel-btn:hover:not(:disabled) {
  background: #e9ecef;
  color: #495057;
}

.submit-btn {
  background: #4068d4;
  color: white;
  min-width: 80px;
}

.submit-btn:hover:not(:disabled) {
  background: #3557c0;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.processing-text {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mini-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .bubble-input-dialog {
    width: 95%;
    margin: 20px;
  }
  
  .dialog-header,
  .dialog-content,
  .dialog-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
  
  .suggestions-list {
    max-height: 120px;
    overflow-y: auto;
  }
}
</style>