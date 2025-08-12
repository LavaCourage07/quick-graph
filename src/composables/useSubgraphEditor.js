import { reactive, ref, computed } from 'vue'

/**
 * 子图编辑器状态管理
 */
export function useSubgraphEditor() {
  // 编辑器核心状态
  const editorState = reactive({
    isActive: false,           // 是否处于编辑模式
    currentMode: 'none',       // 'entity' | 'relation' | 'overall' | 'none'
    isProcessing: false,       // AI处理状态
    selectedEntity: null,      // 选中的节点
    selectedRelation: null,    // 选中的边
    showDifference: false,     // 是否显示差异对比
    thinkingProcess: []        // 思考过程步骤
  })

  // 子图数据状态
  const subgraphData = reactive({
    nodes: [],
    edges: [],
    metadata: {
      originalSubgraphId: '',
      centerNodeId: '',
      createdAt: null,
      lastModified: null
    }
  })

  // 原始完整图数据引用
  const originalData = reactive({
    nodes: [],
    edges: []
  })

  // 修改记录
  const modifications = reactive(new Map())

  // 计算属性
  const hasModifications = computed(() => modifications.size > 0)

  const subgraphElementsCount = computed(() => ({
    nodes: subgraphData.nodes.length,
    edges: subgraphData.edges.length
  }))

  const currentModeTitle = computed(() => {
    switch (editorState.currentMode) {
      case 'entity':
        return '本体优化'
      case 'relation':
        return '关系优化'
      case 'overall':
        return '整体智能优化'
      default:
        return ''
    }
  })

  // 深拷贝函数
  const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime())
    }

    if (obj instanceof Array) {
      return obj.map(item => deepClone(item))
    }

    if (typeof obj === 'object') {
      const clonedObj = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = deepClone(obj[key])
        }
      }
      return clonedObj
    }

    return obj
  }

  // 初始化编辑器
  const initializeEditor = (subgraph, originalCompleteData, centerNodeId = '') => {
    console.log('初始化子图编辑器:', {
      subgraphNodes: subgraph.nodes.length,
      subgraphEdges: subgraph.edges.length,
      centerNodeId
    })

    // 深拷贝子图数据
    subgraphData.nodes = deepClone(subgraph.nodes)
    subgraphData.edges = deepClone(subgraph.edges)
    subgraphData.metadata = {
      originalSubgraphId: `subgraph_${Date.now()}`,
      centerNodeId: centerNodeId,
      createdAt: new Date(),
      lastModified: new Date()
    }

    // 保存原始完整图数据引用
    originalData.nodes = originalCompleteData.nodes
    originalData.edges = originalCompleteData.edges

    // 重置状态
    editorState.isActive = true
    editorState.currentMode = 'none'
    editorState.isProcessing = false
    editorState.selectedEntity = null
    editorState.selectedRelation = null
    editorState.showDifference = false
    editorState.thinkingProcess = []

    // 清空修改记录
    modifications.clear()

    console.log('子图编辑器初始化完成')
  }

  // 切换编辑模式
  const switchMode = (mode) => {
    console.log('切换编辑模式:', mode)
    editorState.currentMode = mode

    // 重置选择状态
    if (mode !== 'entity') {
      editorState.selectedEntity = null
    }
    if (mode !== 'relation') {
      editorState.selectedRelation = null
    }
    if (mode !== 'overall') {
      editorState.thinkingProcess = []
    }

    editorState.showDifference = false
  }

  // 选择实体（节点）
  const selectEntity = (nodeId) => {
    const node = subgraphData.nodes.find(n => n.id === nodeId)
    if (node) {
      editorState.selectedEntity = node
      console.log('选择节点:', nodeId, node.data?.label)
    }
  }

  // 选择关系（边）
  const selectRelation = (edgeId) => {
    const edge = subgraphData.edges.find(e => e.id === edgeId)
    if (edge) {
      editorState.selectedRelation = edge
      console.log('选择边:', edgeId, edge.label)
    }
  }

  // 记录修改
  const recordModification = (type, targetId, userInput, aiResponse, changes) => {
    const modification = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      targetId,
      timestamp: new Date(),
      userInput,
      aiResponse,
      changes,
      status: 'pending'
    }

    modifications.set(modification.id, modification)
    subgraphData.metadata.lastModified = new Date()

    console.log('记录修改:', modification)
    return modification.id
  }

  // 应用修改
  const applyModification = (modificationId) => {
    const modification = modifications.get(modificationId)
    if (!modification) {
      console.error('找不到修改记录:', modificationId)
      return false
    }

    try {
      const { type, targetId, changes } = modification

      if (type === 'entity') {
        const nodeIndex = subgraphData.nodes.findIndex(n => n.id === targetId)
        if (nodeIndex !== -1) {
          // 应用节点修改
          subgraphData.nodes[nodeIndex] = {
            ...subgraphData.nodes[nodeIndex],
            ...changes.after,
            data: {
              ...subgraphData.nodes[nodeIndex].data,
              ...changes.after.data,
              isModified: true,
              modificationHistory: [
                ...(subgraphData.nodes[nodeIndex].data.modificationHistory || []),
                modificationId
              ]
            }
          }
        }
      } else if (type === 'relation') {
        const edgeIndex = subgraphData.edges.findIndex(e => e.id === targetId)
        if (edgeIndex !== -1) {
          // 应用边修改
          subgraphData.edges[edgeIndex] = {
            ...subgraphData.edges[edgeIndex],
            ...changes.after,
            data: {
              ...subgraphData.edges[edgeIndex].data,
              ...changes.after.data,
              isModified: true,
              modificationHistory: [
                ...(subgraphData.edges[edgeIndex].data?.modificationHistory || []),
                modificationId
              ]
            }
          }
        }
      } else if (type === 'overall') {
        // 应用整体修改
        if (changes.after.nodes) {
          subgraphData.nodes = deepClone(changes.after.nodes)
        }
        if (changes.after.edges) {
          subgraphData.edges = deepClone(changes.after.edges)
        }
      }

      // 更新修改状态
      modification.status = 'accepted'
      subgraphData.metadata.lastModified = new Date()

      console.log('应用修改成功:', modificationId)
      return true
    } catch (error) {
      console.error('应用修改失败:', error)
      modification.status = 'rejected'
      return false
    }
  }

  // 拒绝修改
  const rejectModification = (modificationId) => {
    const modification = modifications.get(modificationId)
    if (modification) {
      modification.status = 'rejected'
      console.log('拒绝修改:', modificationId)
    }
  }

  // 获取修改历史
  const getModificationHistory = () => {
    return Array.from(modifications.values()).sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    )
  }

  // 导出当前子图数据
  const exportSubgraphData = () => {
    return {
      nodes: deepClone(subgraphData.nodes),
      edges: deepClone(subgraphData.edges),
      metadata: deepClone(subgraphData.metadata),
      modifications: Array.from(modifications.entries())
    }
  }

  // 重置编辑器
  const resetEditor = () => {
    console.log('重置子图编辑器')

    editorState.isActive = false
    editorState.currentMode = 'none'
    editorState.isProcessing = false
    editorState.selectedEntity = null
    editorState.selectedRelation = null
    editorState.showDifference = false
    editorState.thinkingProcess = []

    subgraphData.nodes = []
    subgraphData.edges = []
    subgraphData.metadata = {
      originalSubgraphId: '',
      centerNodeId: '',
      createdAt: null,
      lastModified: null
    }

    originalData.nodes = []
    originalData.edges = []

    modifications.clear()
  }

  // 设置处理状态
  const setProcessing = (processing) => {
    editorState.isProcessing = processing
  }

  // 设置思考过程
  const setThinkingProcess = (steps) => {
    editorState.thinkingProcess = steps
  }

  // 显示差异对比
  const showDifferenceComparison = (show = true) => {
    editorState.showDifference = show
  }

  return {
    // 状态
    editorState,
    subgraphData,
    originalData,
    modifications,

    // 计算属性
    hasModifications,
    subgraphElementsCount,
    currentModeTitle,

    // 方法
    deepClone,
    initializeEditor,
    switchMode,
    selectEntity,
    selectRelation,
    recordModification,
    applyModification,
    rejectModification,
    getModificationHistory,
    exportSubgraphData,
    resetEditor,
    setProcessing,
    setThinkingProcess,
    showDifferenceComparison
  }
}