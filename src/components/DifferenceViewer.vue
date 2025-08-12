<template>
  <div class="difference-viewer">
    <!-- 头部信息 -->
    <div class="viewer-header">
      <h4>{{ title }}</h4>
      <div class="optimization-info">
        <span class="info-label">优化类型:</span>
        <span class="info-value">{{ optimizationType === 'entity' ? '本体优化' : '关系优化' }}</span>
      </div>
    </div>

    <!-- 差异对比内容 -->
    <div class="comparison-content">
      <!-- 基本信息对比 -->
      <div class="comparison-section">
        <h5>基本信息</h5>
        <div class="comparison-grid">
          <div class="comparison-item">
            <label>名称:</label>
            <div class="value-comparison">
              <span class="old-value">{{ originalData.label || '未命名' }}</span>
              <span class="arrow">→</span>
              <span class="new-value">{{ optimizedData.label || '未命名' }}</span>
            </div>
          </div>
          
          <div v-if="optimizedData.englishName" class="comparison-item">
            <label>英文名称:</label>
            <div class="value-comparison">
              <span class="old-value">{{ originalData.englishName || '无' }}</span>
              <span class="arrow">→</span>
              <span class="new-value">{{ optimizedData.englishName }}</span>
            </div>
          </div>
          
          <div v-if="optimizedData.description" class="comparison-item">
            <label>描述:</label>
            <div class="value-comparison">
              <span class="old-value">{{ originalData.description || '无' }}</span>
              <span class="arrow">→</span>
              <span class="new-value">{{ optimizedData.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 参数对比 -->
      <div v-if="hasParameterChanges" class="comparison-section">
        <h5>参数信息</h5>
        <div class="parameter-comparison">
          <div class="parameter-column">
            <h6>原始参数</h6>
            <div class="parameter-list">
              <span 
                v-for="param in originalData.parameters || []" 
                :key="param"
                class="parameter-tag old"
              >
                {{ param }}
              </span>
              <span v-if="!originalData.parameters?.length" class="empty-state">无参数</span>
            </div>
          </div>
          <div class="parameter-column">
            <h6>优化后参数</h6>
            <div class="parameter-list">
              <span 
                v-for="param in optimizedData.parameters || []" 
                :key="param"
                class="parameter-tag new"
              >
                {{ param }}
              </span>
              <span v-if="!optimizedData.parameters?.length" class="empty-state">无参数</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 特征对比 -->
      <div v-if="hasFeatureChanges" class="comparison-section">
        <h5>特征信息</h5>
        <div class="feature-comparison">
          <div class="feature-column">
            <h6>原始特征</h6>
            <div class="feature-list">
              <span 
                v-for="feature in originalData.features || []" 
                :key="feature"
                class="feature-tag old"
              >
                {{ feature }}
              </span>
              <span v-if="!originalData.features?.length" class="empty-state">无特征</span>
            </div>
          </div>
          <div class="feature-column">
            <h6>优化后特征</h6>
            <div class="feature-list">
              <span 
                v-for="feature in optimizedData.features || []" 
                :key="feature"
                class="feature-tag new"
              >
                {{ feature }}
              </span>
              <span v-if="!optimizedData.features?.length" class="empty-state">无特征</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细变更列表 -->
      <div v-if="changes && changes.length" class="changes-section">
        <h5>详细变更</h5>
        <div class="changes-list">
          <div 
            v-for="change in changes" 
            :key="change.field"
            class="change-item"
          >
            <div class="change-header">
              <span class="field-name">{{ getFieldDisplayName(change.field) }}</span>
              <span class="change-type">{{ getChangeType(change) }}</span>
            </div>
            <div class="change-content">
              <div class="change-values">
                <div class="old-value-block">
                  <label>原值:</label>
                  <span class="value">{{ change.oldValue || '无' }}</span>
                </div>
                <div class="new-value-block">
                  <label>新值:</label>
                  <span class="value">{{ change.newValue || '无' }}</span>
                </div>
              </div>
              <div v-if="change.reason" class="change-reason">
                <label>变更原因:</label>
                <span class="reason-text">{{ change.reason }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI优化说明 -->
      <div v-if="optimizationMessage" class="message-section">
        <h5>AI优化说明</h5>
        <div class="message-content">
          {{ optimizationMessage }}
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="viewer-actions">
      <button 
        @click="handleReject" 
        class="reject-btn"
        :disabled="isProcessing"
      >
        <span v-if="isProcessing">处理中...</span>
        <span v-else>放弃修改</span>
      </button>
      <button 
        @click="handleAccept" 
        class="accept-btn"
        :disabled="isProcessing"
      >
        <span v-if="isProcessing">处理中...</span>
        <span v-else>接受修改</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '优化结果对比'
  },
  optimizationType: {
    type: String,
    required: true, // 'entity' | 'relation'
    validator: (value) => ['entity', 'relation'].includes(value)
  },
  originalData: {
    type: Object,
    required: true
  },
  optimizedData: {
    type: Object,
    required: true
  },
  changes: {
    type: Array,
    default: () => []
  },
  optimizationMessage: {
    type: String,
    default: ''
  },
  isProcessing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['accept', 'reject'])

// 计算属性
const hasParameterChanges = computed(() => {
  const originalParams = props.originalData.parameters || []
  const optimizedParams = props.optimizedData.parameters || []
  return originalParams.length > 0 || optimizedParams.length > 0
})

const hasFeatureChanges = computed(() => {
  const originalFeatures = props.originalData.features || []
  const optimizedFeatures = props.optimizedData.features || []
  return originalFeatures.length > 0 || optimizedFeatures.length > 0
})

// 方法
const getFieldDisplayName = (field) => {
  const fieldNames = {
    'label': '名称',
    'englishName': '英文名称',
    'description': '描述',
    'parameters': '参数',
    'features': '特征',
    'type': '类型',
    'category': '分类',
    'direction': '方向'
  }
  return fieldNames[field] || field
}

const getChangeType = (change) => {
  if (!change.oldValue && change.newValue) {
    return '新增'
  } else if (change.oldValue && !change.newValue) {
    return '删除'
  } else {
    return '修改'
  }
}

const handleAccept = () => {
  console.log('接受优化结果')
  emit('accept', {
    originalData: props.originalData,
    optimizedData: props.optimizedData,
    changes: props.changes
  })
}

const handleReject = () => {
  console.log('拒绝优化结果')
  emit('reject', {
    originalData: props.originalData,
    reason: '用户拒绝优化'
  })
}

// 暴露方法
defineExpose({
  getOptimizedData: () => props.optimizedData,
  getChanges: () => props.changes,
  hasChanges: () => props.changes && props.changes.length > 0
})
</script>

<style scoped>
.difference-viewer {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.viewer-header {
  background: #f8f9fa;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.viewer-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.optimization-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.info-label {
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  background: #4068d4;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.comparison-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comparison-section,
.changes-section,
.message-section {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.comparison-section h5,
.changes-section h5,
.message-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.comparison-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comparison-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comparison-item label {
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value-comparison {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.old-value {
  color: #dc3545;
  text-decoration: line-through;
  opacity: 0.7;
}

.new-value {
  color: #28a745;
  font-weight: 500;
}

.arrow {
  color: #6c757d;
  font-weight: bold;
}

.parameter-comparison,
.feature-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.parameter-column,
.feature-column {
  background: white;
  border-radius: 4px;
  padding: 12px;
  border: 1px solid #e9ecef;
}

.parameter-column h6,
.feature-column h6 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
}

.parameter-list,
.feature-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.parameter-tag,
.feature-tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.parameter-tag.old,
.feature-tag.old {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.2);
}

.parameter-tag.new,
.feature-tag.new {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.2);
}

.empty-state {
  color: #6c757d;
  font-style: italic;
  font-size: 12px;
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.change-item {
  background: white;
  border-radius: 4px;
  padding: 12px;
  border: 1px solid #e9ecef;
}

.change-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.field-name {
  font-weight: 600;
  color: #333;
  font-size: 13px;
}

.change-type {
  background: #6c757d;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  text-transform: uppercase;
}

.change-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.change-values {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.old-value-block,
.new-value-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.old-value-block label,
.new-value-block label {
  font-size: 11px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
}

.old-value-block .value {
  color: #dc3545;
  background: rgba(220, 53, 69, 0.05);
  padding: 4px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.new-value-block .value {
  color: #28a745;
  background: rgba(40, 167, 69, 0.05);
  padding: 4px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.change-reason {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.change-reason label {
  font-size: 11px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
}

.reason-text {
  color: #495057;
  font-size: 12px;
  line-height: 1.4;
  background: rgba(64, 104, 212, 0.05);
  padding: 6px 8px;
  border-radius: 4px;
  border-left: 3px solid #4068d4;
}

.message-content {
  color: #495057;
  font-size: 14px;
  line-height: 1.5;
  background: white;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  border-left: 4px solid #4068d4;
}

.viewer-actions {
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.reject-btn,
.accept-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  min-width: 100px;
}

.reject-btn {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #e9ecef;
}

.reject-btn:hover:not(:disabled) {
  background: #e9ecef;
  color: #495057;
}

.accept-btn {
  background: #28a745;
  color: white;
}

.accept-btn:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.reject-btn:disabled,
.accept-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .parameter-comparison,
  .feature-comparison {
    grid-template-columns: 1fr;
  }
  
  .change-values {
    grid-template-columns: 1fr;
  }
  
  .viewer-actions {
    flex-direction: column;
  }
  
  .reject-btn,
  .accept-btn {
    width: 100%;
  }
}
</style>