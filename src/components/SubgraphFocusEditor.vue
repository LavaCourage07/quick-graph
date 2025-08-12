<template>
  <div class="subgraph-focus-editor">
    <!-- 顶部工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <button @click="returnToMain" class="return-btn">
          ← 返回
        </button>
      </div>
      <div class="toolbar-center">
        <button 
          @click="switchMode('entity')" 
          :class="{ active: currentMode === 'entity' }"
          class="mode-btn"
        >
          本体优化
        </button>
        <button 
          @click="switchMode('relation')" 
          :class="{ active: currentMode === 'relation' }"
          class="mode-btn"
        >
          关系优化
        </button>
        <button 
          @click="switchMode('overall')" 
          :class="{ active: currentMode === 'overall' }"
          class="mode-btn"
        >
          整体智能优化
        </button>
      </div>
      <div class="toolbar-right">
        <span class="subgraph-info">
          子图: {{ subgraphElementsCount.nodes }}个节点, {{ subgraphElementsCount.edges }}条边
          <span v-if="hasModifications" class="modification-indicator">
            • 已修改
          </span>
        </span>
      </div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="editor-content">
      <!-- 左侧画布 -->
      <div class="canvas-area">
        <VueFlow
          v-model="subgraphElements"
          :node-types="nodeTypes"
          :edge-types="edgeTypes"
          :default-viewport="{ zoom: 1 }"
          :min-zoom="0.2"
          :max-zoom="4"
          class="subgraph-canvas"
        >
          <Background />
          <Controls />
          <MiniMap />
        </VueFlow>
      </div>
      
      <!-- 右侧编辑面板 -->
      <div class="edit-panel" v-if="currentMode !== 'none'">
        <div class="panel-header">
          <h3>{{ panelTitle }}</h3>
        </div>
        <div class="panel-content">
          <!-- 本体优化面板 -->
          <EntityOptimizationPanel 
            v-if="currentMode === 'entity'"
            :subgraph-data="subgraphData"
            :is-processing="editorState.isProcessing"
            @node-selected="handleNodeSelected"
            @start-optimization="handleStartOptimization"
          />
          
          <!-- 关系优化面板 -->
          <RelationOptimizationPanel 
            v-else-if="currentMode === 'relation'"
            :subgraph-data="subgraphData"
            :is-processing="editorState.isProcessing"
            @edge-selected="handleEdgeSelected"
            @start-optimization="handleStartOptimization"
          />
          
          <!-- 整体智能优化面板 -->
          <OverallOptimizationPanel 
            v-else-if="currentMode === 'overall'"
            :subgraph-data="subgraphData"
            :is-processing="editorState.isProcessing"
            @start-analysis="handleStartAnalysis"
            @start-optimization="handleStartOverallOptimization"
            @optimization-complete="handleOverallOptimizationComplete"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import CustomNode from './CustomNode.vue'
import RectNode from './RectNode.vue'
import CustomEdge from './CustomEdge.vue'
import EntityOptimizationPanel from './EntityOptimizationPanel.vue'
import RelationOptimizationPanel from './RelationOptimizationPanel.vue'
import OverallOptimizationPanel from './OverallOptimizationPanel.vue'
import { useSubgraphEditor } from '../composables/useSubgraphEditor.js'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

const props = defineProps({
  subgraphData: {
    type: Object,
    required: true,
    default: () => ({ nodes: [], edges: [] })
  },
  originalData: {
    type: Object,
    required: true,
    default: () => ({ nodes: [], edges: [] })
  }
})

const emit = defineEmits(['return-to-main', 'data-changed'])

// 使用子图编辑器状态管理
const {
  editorState,
  subgraphData,
  originalData,
  modifications,
  hasModifications,
  subgraphElementsCount,
  currentModeTitle,
  initializeEditor,
  switchMode: switchEditorMode,
  exportSubgraphData,
  resetEditor
} = useSubgraphEditor()

// VueFlow元素数组
const subgraphElements = ref([])

// 节点和边类型定义
const nodeTypes = {
  custom: CustomNode,
  rect: RectNode
}

const edgeTypes = {
  bezier: CustomEdge
}

// 计算属性
const currentMode = computed(() => editorState.currentMode)
const panelTitle = computed(() => currentModeTitle.value)

// 更新VueFlow元素数组
const updateSubgraphElements = () => {
  subgraphElements.value = [...subgraphData.nodes, ...subgraphData.edges]
}

// 模式切换
const switchMode = (mode) => {
  switchEditorMode(mode)
}

// 返回主画布
const returnToMain = () => {
  console.log('返回主画布')
  // 导出修改后的数据
  const modifiedData = exportSubgraphData()
  
  // 发送修改后的数据给父组件
  emit('data-changed', {
    nodes: modifiedData.nodes,
    edges: modifiedData.edges
  })
  emit('return-to-main')
  
  // 重置编辑器状态
  resetEditor()
}

// 监听props变化，初始化编辑器
watch(() => [props.subgraphData, props.originalData], () => {
  if (props.subgraphData && props.originalData) {
    // 使用composable的初始化方法
    initializeEditor(
      props.subgraphData, 
      props.originalData,
      props.subgraphData.centerNodeId || ''
    )
    updateSubgraphElements()
  }
}, { immediate: true, deep: true })

// 处理节点选择
const handleNodeSelected = (nodeId) => {
  console.log('节点被选中:', nodeId)
  // 这里可以添加节点选择的处理逻辑，比如在画布上高亮显示
}

// 处理边选择
const handleEdgeSelected = (edgeId) => {
  console.log('边被选中:', edgeId)
  // 这里可以添加边选择的处理逻辑，比如在画布上高亮显示
}

// 处理开始优化
const handleStartOptimization = (optimizationData) => {
  console.log('开始优化:', optimizationData)
  // 这里将在后续任务中实现AI优化逻辑
  // 目前只是占位符
}

// 处理开始分析
const handleStartAnalysis = (analysisData) => {
  console.log('开始AI深度分析:', analysisData)
  // 这里可以添加分析开始的处理逻辑
  // 比如更新状态管理中的处理状态
}

// 处理开始整体优化
const handleStartOverallOptimization = (optimizationData) => {
  console.log('开始整体优化:', optimizationData)
  // 这里可以添加整体优化开始的处理逻辑
}

// 处理整体优化完成
const handleOverallOptimizationComplete = (result) => {
  console.log('整体优化完成:', result)
  
  if (result.action === 'accept') {
    // 用户接受了优化结果
    console.log('用户接受了整体优化结果')
    
    // 应用优化结果到子图数据中
    if (result.result?.optimizedSubgraph) {
      applyOverallOptimization(result.result.optimizedSubgraph, result.result.changes)
    }
    
    // 触发数据变更事件
    emit('data-changed', {
      type: 'overall-optimization',
      result: result,
      nodes: subgraphData.nodes,
      edges: subgraphData.edges,
      modifications: exportSubgraphData().modifications,
      hasModifications: hasModifications.value
    })
  } else if (result.action === 'reject') {
    // 用户拒绝了优化结果
    console.log('用户拒绝了整体优化结果')
  }
}

// 应用整体优化结果
const applyOverallOptimization = (optimizedSubgraph, changes) => {
  console.log('应用整体优化结果:', { optimizedSubgraph, changes })
  
  try {
    // 更新节点数据
    if (optimizedSubgraph.nodes) {
      optimizedSubgraph.nodes.forEach(optimizedNode => {
        const nodeIndex = subgraphData.nodes.findIndex(n => n.id === optimizedNode.id)
        if (nodeIndex !== -1) {
          // 保留原有的位置和类型信息，更新其他数据
          const originalNode = subgraphData.nodes[nodeIndex]
          subgraphData.nodes[nodeIndex] = {
            ...originalNode,
            data: {
              ...originalNode.data,
              label: optimizedNode.label || originalNode.data?.label,
              englishName: optimizedNode.englishName || originalNode.data?.englishName,
              description: optimizedNode.description || originalNode.data?.description,
              parameters: optimizedNode.parameters || originalNode.data?.parameters || [],
              features: optimizedNode.features || originalNode.data?.features || [],
              category: optimizedNode.category || originalNode.data?.category,
              isModified: true // 标记为已修改
            }
          }
        }
      })
    }
    
    // 更新边数据
    if (optimizedSubgraph.edges) {
      optimizedSubgraph.edges.forEach(optimizedEdge => {
        const edgeIndex = subgraphData.edges.findIndex(e => e.id === optimizedEdge.id)
        if (edgeIndex !== -1) {
          // 更新现有边
          const originalEdge = subgraphData.edges[edgeIndex]
          subgraphData.edges[edgeIndex] = {
            ...originalEdge,
            label: optimizedEdge.label || originalEdge.label,
            data: {
              ...originalEdge.data,
              englishName: optimizedEdge.englishName || originalEdge.data?.englishName,
              description: optimizedEdge.description || originalEdge.data?.description,
              parameters: optimizedEdge.parameters || originalEdge.data?.parameters || [],
              features: optimizedEdge.features || originalEdge.data?.features || [],
              isModified: true // 标记为已修改
            }
          }
        } else if (optimizedEdge.id.startsWith('new_')) {
          // 添加新边（如果AI建议了新的连接）
          subgraphData.edges.push({
            id: optimizedEdge.id,
            source: optimizedEdge.source,
            target: optimizedEdge.target,
            label: optimizedEdge.label || '新关系',
            type: optimizedEdge.type || 'bezier',
            data: {
              englishName: optimizedEdge.englishName || '',
              description: optimizedEdge.description || '',
              parameters: optimizedEdge.parameters || [],
              features: optimizedEdge.features || [],
              isModified: true
            }
          })
        }
      })
    }
    
    console.log('整体优化结果应用完成')
  } catch (error) {
    console.error('应用整体优化结果失败:', error)
  }
}

// 监听子图数据变化，更新元素数组
watch([() => subgraphData.nodes, () => subgraphData.edges], () => {
  updateSubgraphElements()
}, { deep: true })

// 暴露方法给父组件
defineExpose({
  getCurrentMode: () => editorState.currentMode,
  getSubgraphData: () => exportSubgraphData(),
  switchMode,
  hasModifications: () => hasModifications.value
})
</script>

<style scoped>
.subgraph-focus-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.editor-toolbar {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.toolbar-left {
  flex: 0 0 auto;
}

.toolbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.toolbar-right {
  flex: 0 0 auto;
}

.return-btn {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.return-btn:hover {
  background: #5a6268;
  transform: translateX(-2px);
}

.mode-btn {
  padding: 10px 20px;
  background: #f8f9fa;
  color: #495057;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 120px;
}

.mode-btn:hover {
  background: #e9ecef;
  border-color: #4068d4;
  color: #4068d4;
}

.mode-btn.active {
  background: #4068d4;
  color: white;
  border-color: #4068d4;
  box-shadow: 0 2px 8px rgba(64, 104, 212, 0.3);
}

.subgraph-info {
  font-size: 12px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modification-indicator {
  color: #28a745;
  font-weight: 600;
  font-size: 11px;
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  position: relative;
  background: white;
}

.subgraph-canvas {
  height: 100%;
  width: 100%;
}

.edit-panel {
  width: 400px;
  background: white;
  border-left: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.placeholder-content {
  text-align: center;
  color: #6c757d;
  padding: 40px 20px;
}

.placeholder-content p {
  margin: 10px 0;
  font-size: 14px;
}
</style>