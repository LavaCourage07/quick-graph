<template>
  <div class="relation-optimization-panel">
    <!-- 气泡输入框 -->
    <BubbleInputDialog
      v-model:visible="showInputDialog"
      title="关系优化"
      placeholder="请描述您对这个关系的优化想法..."
      :target-info="inputTargetInfo"
      :is-processing="isProcessing"
      optimization-type="relation"
      @submit="handleOptimizationSubmit"
      @cancel="handleInputCancel"
    />

    <!-- 差异对比组件 -->
    <div v-if="showDifferenceViewer" class="difference-viewer-container">
      <DifferenceViewer
        title="关系优化结果"
        optimization-type="relation"
        :original-data="originalRelationData"
        :optimized-data="optimizedRelationData"
        :changes="optimizationChanges"
        :optimization-message="optimizationMessage"
        :is-processing="isProcessing"
        @accept="handleOptimizationAccept"
        @reject="handleOptimizationReject"
      />
    </div>

    <!-- 主要内容区域 -->
    <div v-if="!showDifferenceViewer" class="main-content">
      <!-- 关系选择区域 -->
      <div class="selection-section">
        <h4>选择关系</h4>
        <div class="relation-selector">
          <select 
            v-model="selectedEdgeId" 
            @change="onEdgeSelect"
            class="edge-select"
          >
            <option value="">请选择要优化的关系...</option>
            <option 
              v-for="edge in availableEdges" 
              :key="edge.id" 
              :value="edge.id"
            >
              {{ getEdgeDisplayName(edge) }}
            </option>
          </select>
        </div>
      </div>

      <!-- 关系详细信息展示 -->
      <div v-if="selectedEdge" class="details-section">
        <h4>关系详细信息</h4>
        <div class="edge-details">
          <div class="detail-item">
            <label>关系名称:</label>
            <span class="detail-value">{{ selectedEdge.label || '未命名关系' }}</span>
          </div>
          <div class="detail-item">
            <label>连接关系:</label>
            <div class="connection-info">
              <span class="node-name">{{ getNodeName(selectedEdge.source) }}</span>
              <span class="arrow">→</span>
              <span class="node-name">{{ getNodeName(selectedEdge.target) }}</span>
            </div>
          </div>
          <div class="detail-item" v-if="selectedEdge.data?.englishName">
            <label>英文名称:</label>
            <span class="detail-value">{{ selectedEdge.data.englishName }}</span>
          </div>
          <div class="detail-item" v-if="selectedEdge.data?.description">
            <label>描述:</label>
            <span class="detail-value">{{ selectedEdge.data.description }}</span>
          </div>
          <div class="detail-item" v-if="selectedEdge.data?.parameters && selectedEdge.data.parameters.length">
            <label>参数:</label>
            <div class="parameter-list">
              <span 
                v-for="param in selectedEdge.data.parameters" 
                :key="param"
                class="parameter-tag"
              >
                {{ param }}
              </span>
            </div>
          </div>
          <div class="detail-item" v-if="selectedEdge.data?.features && selectedEdge.data.features.length">
            <label>特征:</label>
            <div class="feature-list">
              <span 
                v-for="feature in selectedEdge.data.features" 
                :key="feature"
                class="feature-tag"
              >
                {{ feature }}
              </span>
            </div>
          </div>
          <div class="detail-item">
            <label>边类型:</label>
            <span class="detail-value">{{ selectedEdge.type || 'bezier' }}</span>
          </div>
          <div class="detail-item">
            <label>源节点ID:</label>
            <span class="detail-value">{{ selectedEdge.source }}</span>
          </div>
          <div class="detail-item">
            <label>目标节点ID:</label>
            <span class="detail-value">{{ selectedEdge.target }}</span>
          </div>
          <div class="detail-item" v-if="selectedEdge.data?.isModified">
            <label>修改状态:</label>
            <span class="detail-value modified">已修改</span>
          </div>
        </div>
      </div>

      <!-- 智能优化区域 -->
      <div v-if="selectedEdge" class="optimization-section">
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
            点击按钮，输入您的优化想法，AI将帮助您改进这个关系的信息。
          </p>
        </div>
      </div>

      <!-- 空状态提示 -->
      <div v-if="!selectedEdge" class="empty-state">
        <div class="empty-icon">🔗</div>
        <h4>选择关系开始优化</h4>
        <p>请从上方下拉框中选择要优化的关系，然后查看详细信息并进行智能优化。</p>
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

const emit = defineEmits(['edge-selected', 'optimize-request', 'optimization-complete'])

// 选中的边ID
const selectedEdgeId = ref('')

// 对话框状态
const showInputDialog = ref(false)
const showDifferenceViewer = ref(false)

// 优化相关数据
const inputTargetInfo = ref(null)
const originalRelationData = ref(null)
const optimizedRelationData = ref(null)
const optimizationChanges = ref([])
const optimizationMessage = ref('')

// 计算属性
const availableEdges = computed(() => {
  return props.subgraphData.edges || []
})

const selectedEdge = computed(() => {
  if (!selectedEdgeId.value) return null
  return availableEdges.value.find(edge => edge.id === selectedEdgeId.value)
})

// 获取边的显示名称
const getEdgeDisplayName = (edge) => {
  const sourceName = getNodeName(edge.source)
  const targetName = getNodeName(edge.target)
  const relationName = edge.label || '未命名关系'
  return `${sourceName} → ${targetName} (${relationName})`
}

// 获取节点名称
const getNodeName = (nodeId) => {
  const node = props.subgraphData.nodes?.find(n => n.id === nodeId)
  return node?.data?.label || nodeId
}

// 获取源节点和目标节点
const getSourceNode = () => {
  if (!selectedEdge.value) return null
  return props.subgraphData.nodes?.find(n => n.id === selectedEdge.value.source)
}

const getTargetNode = () => {
  if (!selectedEdge.value) return null
  return props.subgraphData.nodes?.find(n => n.id === selectedEdge.value.target)
}

// 边选择处理
const onEdgeSelect = () => {
  if (selectedEdgeId.value) {
    console.log('选择边进行优化:', selectedEdgeId.value)
    emit('edge-selected', selectedEdgeId.value)
  }
}

// 显示优化输入
const showOptimizationInput = () => {
  if (!selectedEdge.value) return
  
  inputTargetInfo.value = {
    name: getEdgeDisplayName(selectedEdge.value),
    type: '关系'
  }
  
  showInputDialog.value = true
}

// 处理优化提交
const handleOptimizationSubmit = async (userInput) => {
  if (!selectedEdge.value) return
  
  const sourceNode = getSourceNode()
  const targetNode = getTargetNode()
  
  if (!sourceNode || !targetNode) {
    console.error('无法找到源节点或目标节点')
    showInputDialog.value = false
    return
  }
  
  try {
    console.log('提交关系优化请求:', userInput)
    
    // 调用AI优化接口
    const result = await kimiAPI.optimizeRelation(
      selectedEdge.value, 
      sourceNode, 
      targetNode, 
      userInput
    )
    
    if (result.success) {
      // 准备对比数据
      originalRelationData.value = {
        label: selectedEdge.value.label || '未命名关系',
        englishName: selectedEdge.value.data?.englishName || '',
        description: selectedEdge.value.data?.description || '',
        parameters: selectedEdge.value.data?.parameters || [],
        features: selectedEdge.value.data?.features || [],
        type: selectedEdge.value.type || 'bezier',
        direction: selectedEdge.value.data?.direction || 'directed',
        category: selectedEdge.value.data?.category || ''
      }
      
      optimizedRelationData.value = result.optimizedRelation
      optimizationChanges.value = result.changes
      optimizationMessage.value = result.message
      
      // 关闭输入框，显示差异对比
      showInputDialog.value = false
      showDifferenceViewer.value = true
    } else {
      console.error('优化失败:', result.message)
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
    type: 'relation',
    edgeId: selectedEdge.value.id,
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
    type: 'relation',
    edgeId: selectedEdge.value.id,
    originalData: data.originalData,
    action: 'reject'
  })
  
  // 重置状态
  resetOptimizationState()
}

// 重置优化状态
const resetOptimizationState = () => {
  showDifferenceViewer.value = false
  originalRelationData.value = null
  optimizedRelationData.value = null
  optimizationChanges.value = []
  optimizationMessage.value = ''
}

// 监听子图数据变化，重置选择
watch(() => props.subgraphData, () => {
  // 如果当前选中的边不在新的子图数据中，重置选择
  if (selectedEdgeId.value && !availableEdges.value.find(e => e.id === selectedEdgeId.value)) {
    selectedEdgeId.value = ''
  }
}, { deep: true })

// 暴露方法
defineExpose({
  selectEdge: (edgeId) => {
    selectedEdgeId.value = edgeId
    onEdgeSelect()
  },
  getSelectedEdge: () => selectedEdge.value,
  clearSelection: () => {
    selectedEdgeId.value = ''
    resetOptimizationState()
  }
})
</script>

<style scoped>
.relation-optimization-panel {
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

.edge-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

.edge-select:focus {
  outline: none;
  border-color: #4068d4;
  box-shadow: 0 0 0 2px rgba(64, 104, 212, 0.2);
}

.edge-details {
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

.connection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.node-name {
  background: #4068d4;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  flex: 1;
  text-align: center;
}

.arrow {
  color: #6c757d;
  font-weight: bold;
  font-size: 16px;
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