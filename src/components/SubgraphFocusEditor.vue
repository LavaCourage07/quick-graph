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
          @pane-ready="handlePaneReady"
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
            @highlight-element="handleHighlightElement"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
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
  resetEditor,
  recordModification,
  applyModification,
  deepClone,
  restoreFromSnapshot,
  saveSubgraphModificationState,
  getSubgraphModificationState,
  clearSubgraphModificationState,
  enterSubgraphEditMode,
  exitSubgraphEditMode
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
  console.log('🔄 开始更新VueFlow元素数组')
  console.log('📊 原始数据:', {
    nodeCount: subgraphData.nodes.length,
    edgeCount: subgraphData.edges.length
  })
  
  // 确保清除所有高亮状态后再更新元素
  const cleanNodes = subgraphData.nodes.map(node => {
    const cleanNode = {
      ...node,
      class: node.class ? node.class.replace(/\s*(highlighted|subgraph-highlighted|dimmed)/g, '') : '',
      data: {
        ...node.data,
        highlighted: false,
        subgraphHighlighted: false,
        dimmed: false
      }
    }
    
    // 保留修改相关的样式类和数据
    if (node.data?.isNewlyAdded) {
      cleanNode.class = (cleanNode.class || '').replace(/\s*newly-added-node/g, '') + ' newly-added-node'
      cleanNode.data.isNewlyAdded = true
      cleanNode.data.isModified = true // 确保新增节点也标记为修改状态
      console.log(`🔵 保留新增节点样式: ${node.id}, class: ${cleanNode.class}`)
    } else if (node.data?.isModified) {
      cleanNode.class = (cleanNode.class || '').replace(/\s*modified-node/g, '') + ' modified-node'
      cleanNode.data.isModified = true
      console.log(`✏️ 保留修改节点样式: ${node.id}, class: ${cleanNode.class}`)
    }
    
    return cleanNode
  })
  
  const cleanEdges = subgraphData.edges.map(edge => {
    const cleanEdge = {
      ...edge,
      class: edge.class ? edge.class.replace(/\s*(highlighted|subgraph-highlighted|dimmed)/g, '') : '',
      highlighted: false,
      subgraphHighlighted: false,
      dimmed: false,
      data: {
        ...edge.data,
        highlighted: false,
        subgraphHighlighted: false,
        dimmed: false
      }
    }
    
    // 保留修改相关的样式类和数据
    if (edge.data?.isNewlyAdded) {
      cleanEdge.class = (cleanEdge.class || '').replace(/\s*newly-added-edge/g, '') + ' newly-added-edge'
      cleanEdge.data.isNewlyAdded = true
      cleanEdge.data.isModified = true // 确保新增关系也标记为修改状态
      console.log(`🔗 保留新增关系样式: ${edge.id}, class: ${cleanEdge.class}`)
    } else if (edge.data?.isModified) {
      cleanEdge.class = (cleanEdge.class || '').replace(/\s*modified-edge/g, '') + ' modified-edge'
      cleanEdge.data.isModified = true
      console.log(`✏️ 保留修改关系样式: ${edge.id}, class: ${cleanEdge.class}`)
    }
    
    return cleanEdge
  })
  
  subgraphElements.value = [...cleanNodes, ...cleanEdges]
  
  console.log('🔄 VueFlow元素数组更新完成')
  console.log('📊 最终元素统计:', {
    totalElements: subgraphElements.value.length,
    nodes: cleanNodes.length,
    edges: cleanEdges.length,
    newlyAddedNodes: cleanNodes.filter(n => n.data?.isNewlyAdded).length,
    newlyAddedEdges: cleanEdges.filter(e => e.data?.isNewlyAdded).length,
    modifiedNodes: cleanNodes.filter(n => n.data?.isModified && !n.data?.isNewlyAdded).length,
    modifiedEdges: cleanEdges.filter(e => e.data?.isModified && !e.data?.isNewlyAdded).length
  })
  
  // 打印所有元素的详细信息
  subgraphElements.value.forEach(element => {
    if (element.data?.isNewlyAdded || element.data?.isModified) {
      console.log(`🎯 修改元素详情:`, {
        id: element.id,
        type: element.type || 'edge',
        label: element.data?.label || element.label,
        class: element.class,
        isNewlyAdded: element.data?.isNewlyAdded,
        isModified: element.data?.isModified
      })
    }
  })
}

// 模式切换
const switchMode = (mode) => {
  switchEditorMode(mode)
}

// 处理VueFlow准备就绪
const handlePaneReady = () => {
  console.log('VueFlow画布准备就绪，最终清除高亮状态')
  
  // 最后一次强制清除高亮状态
  setTimeout(() => {
    subgraphElements.value.forEach(element => {
      if (element.type !== 'edge') {
        // 节点
        if (element.data) {
          element.data.highlighted = false
          element.data.subgraphHighlighted = false
          element.data.dimmed = false
        }
      } else {
        // 边
        element.highlighted = false
        element.subgraphHighlighted = false
        element.dimmed = false
        if (element.data) {
          element.data.highlighted = false
          element.data.subgraphHighlighted = false
          element.data.dimmed = false
        }
      }
    })
    console.log('VueFlow画布高亮状态已最终清除')
  }, 100)
}

// 返回主画布
const returnToMain = () => {
  console.log('=== 返回主画布开始 ===')
  
  // 检查是否有修改
  const hasAnyModifications = hasModifications.value || 
    subgraphData.nodes.some(n => n.data?.isModified) || 
    subgraphData.edges.some(e => e.data?.isModified)
  
  console.log('修改状态检查:', {
    hasModifications: hasModifications.value,
    modifiedNodes: subgraphData.nodes.filter(n => n.data?.isModified).map(n => ({ id: n.id, label: n.data?.label })),
    modifiedEdges: subgraphData.edges.filter(e => e.data?.isModified).map(e => ({ id: e.id, label: e.data?.label })),
    newlyAddedNodes: subgraphData.nodes.filter(n => n.data?.isNewlyAdded).map(n => ({ id: n.id, label: n.data?.label })),
    newlyAddedEdges: subgraphData.edges.filter(e => e.data?.isNewlyAdded).map(e => ({ id: e.id, label: e.data?.label }))
  })
  
  // 如果有修改，保存修改状态
  if (hasAnyModifications) {
    const subgraphId = subgraphData.metadata.originalSubgraphId || 'current-subgraph'
    const modificationData = {
      modifiedNodes: subgraphData.nodes.filter(n => n.data?.isModified).map(n => n.id),
      modifiedEdges: subgraphData.edges.filter(e => e.data?.isModified).map(e => e.id),
      newNodes: subgraphData.nodes.filter(n => n.data?.isNewlyAdded).map(n => n.id),
      newEdges: subgraphData.edges.filter(e => e.data?.isNewlyAdded).map(e => e.id)
    }
    saveSubgraphModificationState(subgraphId, modificationData)
    console.log('已保存修改状态:', modificationData)
  }
  
  // 导出修改后的数据
  const modifiedData = exportSubgraphData()
  console.log('导出的修改数据:', {
    nodes: modifiedData.nodes.length,
    edges: modifiedData.edges.length,
    nodeDetails: modifiedData.nodes.map(n => ({ id: n.id, label: n.data?.label, type: n.type })),
    edgeDetails: modifiedData.edges.map(e => ({ id: e.id, label: e.data?.label, source: e.source, target: e.target }))
  })
  
  // 发送修改后的数据给父组件
  emit('data-changed', {
    nodes: modifiedData.nodes,
    edges: modifiedData.edges,
    hasModifications: hasAnyModifications
  })
  emit('return-to-main')
  
  console.log('=== 返回主画布完成 ===')
  
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
    
    // 进入子图编辑模式，清除高亮效果
    enterSubgraphEditMode()
    
    // 强制清除所有高亮状态
    nextTick(() => {
      console.log('强制清除子图中的所有高亮状态')
      subgraphData.nodes.forEach(node => {
        if (node.data) {
          node.data.highlighted = false
          node.data.subgraphHighlighted = false
          node.data.dimmed = false
        }
      })
      
      subgraphData.edges.forEach(edge => {
        edge.highlighted = false
        edge.subgraphHighlighted = false
        edge.dimmed = false
        if (edge.data) {
          edge.data.highlighted = false
          edge.data.subgraphHighlighted = false
          edge.data.dimmed = false
        }
      })
      
      updateSubgraphElements()
    })
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
  
  // 如果需要立即应用优化结果
  if (optimizationData.applyImmediately && optimizationData.optimizationResult?.optimizedSubgraph) {
    console.log('立即应用AI优化结果到子图（暂存状态）')
    
    // 直接应用优化结果到子图数据中
    applyOverallOptimization(
      optimizationData.optimizationResult.optimizedSubgraph, 
      optimizationData.optimizationResult.changes
    )
    
    // 高亮修改的元素
    if (optimizationData.modificationDiff) {
      highlightModifiedElements(optimizationData.modificationDiff)
    }
    
    console.log('AI优化结果已应用到子图，等待用户确认')
  }
}

// 高亮修改的元素
const highlightModifiedElements = (modificationDiff) => {
  console.log('🎨 开始高亮修改的元素')
  console.log('📋 修改差异列表:', modificationDiff)
  console.log('🔍 当前subgraphElements数量:', subgraphElements.value.length)
  
  // 清除之前的高亮
  clearElementHighlights()
  
  // 为每个修改的元素添加高亮样式
  modificationDiff.forEach((diff, index) => {
    console.log(`🎯 处理第${index + 1}个差异:`, {
      type: diff.type,
      action: diff.action,
      elementId: diff.elementId,
      elementName: diff.elementName
    })
    
    const element = subgraphElements.value.find(el => el.id === diff.elementId)
    if (element) {
      console.log(`✅ 找到元素 ${diff.elementId}:`, {
        currentClass: element.class,
        currentData: element.data
      })
      
      // 添加修改标记，仅对"modified"标记为修改；"added"只标记新增
      element.data = element.data || {}
      if (diff.action === 'modified') {
        element.data.isModified = true
      }
      element.data.modificationType = diff.action
      
      // 根据操作类型添加不同的样式类
      if (diff.action === 'added') {
        // 新增元素 - 蓝色虚线
        if (diff.type === 'node') {
          element.class = (element.class || '') + ' newly-added-node'
          // 确保内部节点组件也能识别为新增（用于应用深蓝色虚线样式与名称显示）
          element.data.isNewlyAdded = true
          element.data.isModified = true
          console.log(`🔵 为新增节点 ${diff.elementId} 添加样式类: newly-added-node`)
        } else if (diff.type === 'edge') {
          element.class = (element.class || '') + ' newly-added-edge'
          // 确保边的样式计算能识别新增
          if (!element.data) element.data = {}
          element.data.isNewlyAdded = true
          element.data.isModified = true
          console.log(`🔗 为新增关系 ${diff.elementId} 添加样式类: newly-added-edge`)
        }
      } else if (diff.action === 'modified') {
        // 修改元素 - 蓝色竖线
        if (diff.type === 'node') {
          element.class = (element.class || '') + ' modified-node'
          console.log(`✏️ 为修改节点 ${diff.elementId} 添加样式类: modified-node`)
        } else if (diff.type === 'edge') {
          element.class = (element.class || '') + ' modified-edge'
          console.log(`✏️ 为修改关系 ${diff.elementId} 添加样式类: modified-edge`)
        }
      }
      
      console.log(`🎨 元素 ${diff.elementId} 样式更新后:`, {
        class: element.class,
        isModified: element.data.isModified,
        modificationType: element.data.modificationType
      })
    } else {
      console.error(`❌ 未找到元素 ${diff.elementId} 在 subgraphElements 中`)
      console.log('🔍 当前所有元素ID:', subgraphElements.value.map(el => el.id))
    }
  })
  
  console.log('🎨 高亮处理完成')
}

// 清除元素高亮
const clearElementHighlights = () => {
  subgraphElements.value.forEach(element => {
    if (element.data?.isModified) {
      element.data.isModified = false
      element.data.modificationType = null
    }
    if (element.class) {
      element.class = element.class.replace(/\s*(modified-(node|edge)|newly-added-(node|edge))/g, '')
    }
  })
}

// 处理高亮单个元素
const handleHighlightElement = (elementId) => {
  console.log('高亮元素:', elementId)
  
  // 清除之前的临时高亮
  subgraphElements.value.forEach(element => {
    if (element.class) {
      element.class = element.class.replace(/\s*highlight-temp/g, '')
    }
  })
  
  // 高亮指定元素
  const element = subgraphElements.value.find(el => el.id === elementId)
  if (element) {
    element.class = (element.class || '') + ' highlight-temp'
    
    // 3秒后移除临时高亮
    setTimeout(() => {
      if (element.class) {
        element.class = element.class.replace(/\s*highlight-temp/g, '')
      }
    }, 3000)
  }
}

// 处理整体优化完成
const handleOverallOptimizationComplete = (result) => {
  console.log('优化完成:', result)
  
  if (result.action === 'accept') {
    // 用户采纳了优化结果 - 固化修改
    console.log(`用户采纳了${result.type}优化结果，固化修改`)
    
    // 根据优化类型记录修改
    const optimizationType = result.type || 'overall'
    const optimizationName = optimizationType === 'language' ? '语言交互优化' : '整体智能优化'
    
    // 记录这次优化修改为已接受状态
    const modificationId = recordModification(
      optimizationType,
      'subgraph',
      optimizationName,
      result.result,
      {
        before: result.preOptimizationSnapshot || {
          nodes: deepClone(subgraphData.nodes),
          edges: deepClone(subgraphData.edges)
        },
        after: {
          nodes: deepClone(subgraphData.nodes),
          edges: deepClone(subgraphData.edges)
        }
      }
    )
    
    // 应用修改记录（固化修改）
    applyModification(modificationId)
    
    // 清除高亮
    clearElementHighlights()
    
    // 关闭优化面板
    switchMode('none')
    
    console.log(`${optimizationName}结果已固化，面板已关闭`)
    
    // 如果是语言优化，自动触发数据传递
    if (optimizationType === 'language') {
      console.log('语言优化完成，自动触发数据传递')
      // 延迟一下确保状态更新完成
      setTimeout(() => {
        handleReturnToMain()
      }, 100)
    }
  } else if (result.action === 'reject') {
    // 用户放弃了优化结果 - 撤回暂存修改
    console.log(`用户放弃了${result.type}优化结果，撤回暂存修改`)
    
    if (result.preOptimizationSnapshot) {
      // 恢复到优化前的快照
      restoreFromSnapshot(result.preOptimizationSnapshot)
      console.log('已恢复到优化前的子图状态')
    } else {
      console.log('没有优化前快照，保持当前状态')
    }
    
    // 清除高亮
    clearElementHighlights()
    
    // 关闭优化面板
    switchMode('none')
    
    console.log('暂存修改已撤回，面板已关闭')
  }
}

// 应用整体优化结果
const applyOverallOptimization = (optimizedSubgraph, changes) => {
  console.log('🚀 开始应用整体优化结果')
  console.log('📊 优化数据:', { 
    nodeCount: optimizedSubgraph.nodes?.length || 0,
    edgeCount: optimizedSubgraph.edges?.length || 0,
    changes 
  })
  
  try {
    // 更新和添加节点数据
    if (optimizedSubgraph.nodes) {
      console.log(`📝 处理 ${optimizedSubgraph.nodes.length} 个节点`)
      
      optimizedSubgraph.nodes.forEach((optimizedNode, index) => {
        const nodeIndex = subgraphData.nodes.findIndex(n => n.id === optimizedNode.id)
        if (nodeIndex !== -1) {
          // 更新现有节点
          const originalNode = subgraphData.nodes[nodeIndex]
          const updatedNode = {
            ...originalNode,
            label: (optimizedNode.data && optimizedNode.data.label)
              ? optimizedNode.data.label
              : (optimizedNode.label || originalNode.label),
            data: {
              ...originalNode.data,
              englishName: optimizedNode.data?.englishName || optimizedNode.englishName || originalNode.data?.englishName,
              description: optimizedNode.data?.description || optimizedNode.description || originalNode.data?.description,
              properties: optimizedNode.data?.properties || optimizedNode.properties || originalNode.data?.properties || [],
              features: optimizedNode.data?.features || optimizedNode.features || originalNode.data?.features || []
            }
          }
          // 使用splice确保响应式更新
          subgraphData.nodes.splice(nodeIndex, 1, updatedNode)
          console.log(`✏️ 节点 ${optimizedNode.id} 已更新`)
        } else {
          // 添加新节点
          console.log(`➕ 添加新节点:`, {
            id: optimizedNode.id,
            label: optimizedNode.data?.label,
            type: optimizedNode.type,
            isNewlyAdded: optimizedNode.data?.isNewlyAdded
          })
          // 补全新增节点的必要字段与高亮标记
          const filledNode = {
            ...optimizedNode,
            type: optimizedNode.type || 'rect',
            data: {
              ...(optimizedNode.data || {}),
              // 名称优先使用 AI 返回的 data.label，其次顶层 label，最后回退为 id
              label: (optimizedNode.data && optimizedNode.data.label)
                ? optimizedNode.data.label
                : (optimizedNode.label || optimizedNode.id || 'AI新增节点'),
              isNewlyAdded: true,
              isModified: true
            },
            class: ((optimizedNode.class || '') + ' newly-added-node').trim()
          }
          subgraphData.nodes.push(filledNode)
        }
      })
      
      console.log(`📝 节点处理完成，当前节点总数: ${subgraphData.nodes.length}`)
    }
    
    // 更新和添加边数据
    if (optimizedSubgraph.edges) {
      console.log(`🔗 处理 ${optimizedSubgraph.edges.length} 个关系`)
      
      optimizedSubgraph.edges.forEach((optimizedEdge, index) => {
        const edgeIndex = subgraphData.edges.findIndex(e => e.id === optimizedEdge.id)
        if (edgeIndex !== -1) {
          // 更新现有边
          const originalEdge = subgraphData.edges[edgeIndex]
          const updatedEdge = {
            ...originalEdge,
            label: optimizedEdge.label || originalEdge.label || optimizedEdge.data?.label,
            data: {
              ...originalEdge.data,
              englishName: optimizedEdge.data?.englishName || optimizedEdge.englishName || originalEdge.data?.englishName,
              description: optimizedEdge.data?.description || optimizedEdge.description || originalEdge.data?.description,
              parameters: optimizedEdge.data?.parameters || optimizedEdge.parameters || originalEdge.data?.parameters || [],
              features: optimizedEdge.data?.features || optimizedEdge.features || originalEdge.data?.features || []
            }
          }
          // 使用splice确保响应式更新
          subgraphData.edges.splice(edgeIndex, 1, updatedEdge)
          console.log(`✏️ 关系 ${optimizedEdge.id} 已更新`)
        } else {
          // 添加新边
          console.log(`➕ 添加新关系:`, {
            id: optimizedEdge.id,
            source: optimizedEdge.source,
            target: optimizedEdge.target,
            label: optimizedEdge.label,
            type: optimizedEdge.type,
            isNewlyAdded: optimizedEdge.data?.isNewlyAdded
          })
          // 补全新增边的必要字段与高亮标记
          const filledEdge = {
            ...optimizedEdge,
            type: optimizedEdge.type || 'bezier',
            // 边名称优先使用顶层 label，其次 data.label
            label: optimizedEdge.label || optimizedEdge.data?.label || 'AI新增关系',
            data: {
              ...(optimizedEdge.data || {}),
              isNewlyAdded: true,
              isModified: true
            },
            class: ((optimizedEdge.class || '') + ' newly-added-edge').trim()
          }
          subgraphData.edges.push(filledEdge)
        }
      })
      
      console.log(`🔗 关系处理完成，当前关系总数: ${subgraphData.edges.length}`)
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
  position: relative;
  z-index: 10;
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
  /* padding: 20px; */
  overflow-y: auto;
  /* 确保面板内容不会被底部元素遮挡 */
  padding-bottom: 40px;
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

/* 修改高亮样式 - 现在由CustomNode和CustomEdge组件处理 */

/* 临时高亮 */
:deep(.vue-flow__node.highlight-temp) {
  border: 3px solid #ffc107 !important;
  box-shadow: 0 0 20px rgba(255, 193, 7, 0.6) !important;
  animation: highlight-flash 0.5s ease-in-out 3;
}

:deep(.vue-flow__edge.highlight-temp .vue-flow__edge-path) {
  stroke: #ffc107 !important;
  stroke-width: 4px !important;
  filter: drop-shadow(0 0 8px rgba(255, 193, 7, 0.8));
  animation: highlight-flash 0.5s ease-in-out 3;
}

/* 动画现在由CustomNode和CustomEdge组件处理 */

@keyframes highlight-flash {
  0% {
    box-shadow: 0 0 20px rgba(255, 193, 7, 0.6);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 193, 7, 1);
  }
  100% {
    box-shadow: 0 0 20px rgba(255, 193, 7, 0.6);
  }
}
</style>