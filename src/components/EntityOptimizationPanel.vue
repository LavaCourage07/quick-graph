<template>
  <div class="entity-optimization-panel">
    <!-- 气泡输入框 -->
    <BubbleInputDialog
      v-model:visible="showInputDialog"
      title="本体优化"
      placeholder="请描述您对这个节点的优化想法..."
      :target-info="inputTargetInfo"
      :is-processing="isProcessing"
      optimization-type="entity"
      @submit="handleOptimizationSubmit"
      @cancel="handleInputCancel"
    />

    <!-- 差异对比组件 -->
    <div v-if="showDifferenceViewer" class="difference-viewer-container">
      <DifferenceViewer
        title="本体优化结果"
        optimization-type="entity"
        :original-data="originalNodeData"
        :optimized-data="optimizedNodeData"
        :changes="optimizationChanges"
        :optimization-message="optimizationMessage"
        :is-processing="isProcessing"
        @accept="handleOptimizationAccept"
        @reject="handleOptimizationReject"
      />
    </div>

    <!-- 主要内容区域 -->
    <div v-if="!showDifferenceViewer" class="main-content">
      <!-- 节点选择区域 -->
      <div class="selection-section">
        <h4>选择节点</h4>
        <div class="node-selector">
          <select 
            v-model="selectedNodeId" 
            @change="onNodeSelect"
            class="node-select"
          >
            <option value="">请选择要优化的节点...</option>
            <option 
              v-for="node in availableNodes" 
              :key="node.id" 
              :value="node.id"
            >
              {{ node.data.label || node.id }}
            </option>
          </select>
        </div>
      </div>

      <!-- 节点详细信息展示 -->
      <div v-if="selectedNode" class="details-section">
        <h4>节点详细信息</h4>
        <div class="node-details">
          <div class="detail-item">
            <label>节点名称:</label>
            <span class="detail-value">{{ selectedNode.data.label || '未命名' }}</span>
          </div>
          <div class="detail-item" v-if="selectedNode.data.englishName">
            <label>英文名称:</label>
            <span class="detail-value">{{ selectedNode.data.englishName }}</span>
          </div>
          <div class="detail-item" v-if="selectedNode.data.description">
            <label>描述:</label>
            <span class="detail-value">{{ selectedNode.data.description }}</span>
          </div>
          <div class="detail-item" v-if="selectedNode.data.parameters && selectedNode.data.parameters.length">
            <label>参数:</label>
            <div class="parameter-list">
              <span 
                v-for="param in selectedNode.data.parameters" 
                :key="param"
                class="parameter-tag"
              >
                {{ param }}
              </span>
            </div>
          </div>
          <div class="detail-item" v-if="selectedNode.data.features && selectedNode.data.features.length">
            <label>特征:</label>
            <div class="feature-list">
              <span 
                v-for="feature in selectedNode.data.features" 
                :key="feature"
                class="feature-tag"
              >
                {{ feature }}
              </span>
            </div>
          </div>
          <div class="detail-item">
            <label>节点类型:</label>
            <span class="detail-value">{{ selectedNode.type || 'custom' }}</span>
          </div>
          <div class="detail-item">
            <label>位置:</label>
            <span class="detail-value">
              ({{ Math.round(selectedNode.position.x) }}, {{ Math.round(selectedNode.position.y) }})
            </span>
          </div>
          <div class="detail-item" v-if="selectedNode.data.isModified">
            <label>修改状态:</label>
            <span class="detail-value modified">已修改</span>
          </div>
        </div>
      </div>

      <!-- 智能优化区域 -->
      <div v-if="selectedNode" class="optimization-section">
        <h4>智能优化</h4>
        <div class="optimization-controls">
          <button 
            @click="showOptimizationInput" 
            :disabled="isProcessing"
            class="optimize-btn"
          >
            <span v-if="isProcessing">处理中...</span>
            <span v-else>智能优化</span>
          </button>
          <p class="optimization-hint">
            点击按钮，输入您的优化想法，AI将帮助您改进这个节点的信息。
          </p>
        </div>
      </div>

      <!-- 空状态提示 -->
      <div v-if="!selectedNode" class="empty-state">
        <div class="empty-icon">🎯</div>
        <h4>选择节点开始优化</h4>
        <p>请从上方下拉框中选择要优化的节点，然后查看详细信息并进行智能优化。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BubbleInputDialog from './BubbleInputDialog.vue'
import DifferenceViewer from './DifferenceViewer.vue'
import { kimiAPI } from '../api/kimi.js'

const props = defineProps({
  subgraphData: {
    type: Object,
    required: true
  },
  isProcessing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['node-selected', 'optimize-request', 'optimization-complete'])

// 选中的节点ID
const selectedNodeId = ref('')

// 对话框状态
const showInputDialog = ref(false)
const showDifferenceViewer = ref(false)

// 优化相关数据
const inputTargetInfo = ref(null)
const originalNodeData = ref(null)
const optimizedNodeData = ref(null)
const optimizationChanges = ref([])
const optimizationMessage = ref('')

// 计算属性
const availableNodes = computed(() => {
  return props.subgraphData.nodes || []
})

const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null
  return availableNodes.value.find(node => node.id === selectedNodeId.value)
})

// 节点选择处理
const onNodeSelect = () => {
  if (selectedNodeId.value) {
    console.log('选择节点进行优化:', selectedNodeId.value)
    emit('node-selected', selectedNodeId.value)
  }
}

// 显示优化输入
const showOptimizationInput = () => {
  if (!selectedNode.value) return
  
  inputTargetInfo.value = {
    name: selectedNode.value.data.label || selectedNode.value.id,
    type: '节点'
  }
  
  showInputDialog.value = true
}

// 处理优化提交
const handleOptimizationSubmit = async (userInput) => {
  if (!selectedNode.value) return
  
  try {
    console.log('提交本体优化请求:', userInput)
    
    // 调用AI优化接口
    const result = await kimiAPI.optimizeEntity(selectedNode.value, userInput)
    
    if (result.success) {
      // 准备对比数据
      originalNodeData.value = {
        label: selectedNode.value.data.label || selectedNode.value.id,
        englishName: selectedNode.value.data.englishName || '',
        description: selectedNode.value.data.description || '',
        parameters: selectedNode.value.data.parameters || [],
        features: selectedNode.value.data.features || [],
        type: selectedNode.value.type || 'custom',
        category: selectedNode.value.data.category || ''
      }
      
      optimizedNodeData.value = result.optimizedNode
      optimizationChanges.value = result.changes
      optimizationMessage.value = result.message
      
      // 关闭输入框，显示差异对比
      showInputDialog.value = false
      showDifferenceViewer.value = true
    } else {
      console.error('优化失败:', result.message)
      // 这里可以显示错误提示
      showInputDialog.value = false
    }
  } catch (error) {
    console.error('优化请求失败:', error)
    showInputDialog.value = false
  }
}

// 处理输入取消
const handleInputCancel = () => {
  showInputDialog.value = false
}

// 处理优化接受
const handleOptimizationAccept = (data) => {
  console.log('接受优化结果:', data)
  
  // 发送优化完成事件给父组件
  emit('optimization-complete', {
    type: 'entity',
    nodeId: selectedNode.value.id,
    originalData: data.originalData,
    optimizedData: data.optimizedData,
    changes: data.changes,
    action: 'accept'
  })
  
  // 重置状态
  resetOptimizationState()
}

// 处理优化拒绝
const handleOptimizationReject = (data) => {
  console.log('拒绝优化结果:', data)
  
  // 发送优化完成事件给父组件
  emit('optimization-complete', {
    type: 'entity',
    nodeId: selectedNode.value.id,
    originalData: data.originalData,
    action: 'reject'
  })
  
  // 重置状态
  resetOptimizationState()
}

// 重置优化状态
const resetOptimizationState = () => {
  showDifferenceViewer.value = false
  originalNodeData.value = null
  optimizedNodeData.value = null
  optimizationChanges.value = []
  optimizationMessage.value = ''
}

// 监听子图数据变化，重置选择
watch(() => props.subgraphData, () => {
  // 如果当前选中的节点不在新的子图数据中，重置选择
  if (selectedNodeId.value && !availableNodes.value.find(n => n.id === selectedNodeId.value)) {
    selectedNodeId.value = ''
  }
}, { deep: true })

// 暴露方法
defineExpose({
  selectNode: (nodeId) => {
    selectedNodeId.value = nodeId
    onNodeSelect()
  },
  getSelectedNode: () => selectedNode.value,
  clearSelection: () => {
    selectedNodeId.value = ''
    resetOptimizationState()
  }
})
</script>

<style scoped>
.entity-optimization-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.difference-viewer-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.selection-section,
.details-section,
.optimization-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.selection-section h4,
.details-section h4,
.optimization-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.node-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

.node-select:focus {
  outline: none;
  border-color: #4068d4;
  box-shadow: 0 0 0 2px rgba(64, 104, 212, 0.2);
}

.node-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 14px;
  color: #333;
  background: white;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.detail-value.modified {
  color: #dc3545;
  font-weight: 600;
}

.parameter-list,
.feature-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.parameter-tag,
.feature-tag {
  background: #4068d4;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.feature-tag {
  background: #28a745;
}

.optimize-btn {
  width: 100%;
  padding: 12px;
  background: #4068d4;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.optimize-btn:hover:not(:disabled) {
  background: #3557c0;
  transform: translateY(-1px);
}

.optimize-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.optimization-hint {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #6c757d;
  line-height: 1.4;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #6c757d;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  color: #495057;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  max-width: 280px;
}
</style>