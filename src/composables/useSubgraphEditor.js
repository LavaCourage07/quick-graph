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

  // 子图修改状态跟踪
  const subgraphModificationStates = reactive(new Map())

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

    // 深拷贝子图数据 - 使用splice确保响应式更新
    const clonedNodes = deepClone(subgraph.nodes)
    const clonedEdges = deepClone(subgraph.edges)
    
    // 清空现有数组并添加新元素，确保响应式更新
    subgraphData.nodes.splice(0, subgraphData.nodes.length, ...clonedNodes)
    subgraphData.edges.splice(0, subgraphData.edges.length, ...clonedEdges)
    
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

  // 撤回最后一次修改
  const undoLastModification = () => {
    const history = getModificationHistory()
    const lastModification = history.find(mod => mod.status === 'accepted')

    if (lastModification) {
      console.log('撤回修改:', lastModification.id)

      try {
        const { type, changes } = lastModification

        if (type === 'overall') {
          // 撤回整体修改，恢复到修改前的状态
          if (changes.before.nodes) {
            subgraphData.nodes = deepClone(changes.before.nodes)
          }
          if (changes.before.edges) {
            subgraphData.edges = deepClone(changes.before.edges)
          }
        } else if (type === 'entity') {
          // 撤回节点修改
          const nodeIndex = subgraphData.nodes.findIndex(n => n.id === lastModification.targetId)
          if (nodeIndex !== -1 && changes.before) {
            subgraphData.nodes[nodeIndex] = deepClone(changes.before)
          }
        } else if (type === 'relation') {
          // 撤回边修改
          const edgeIndex = subgraphData.edges.findIndex(e => e.id === lastModification.targetId)
          if (edgeIndex !== -1 && changes.before) {
            subgraphData.edges[edgeIndex] = deepClone(changes.before)
          }
        }

        // 标记修改为已撤回
        lastModification.status = 'undone'
        subgraphData.metadata.lastModified = new Date()

        console.log('修改撤回成功')
        return true
      } catch (error) {
        console.error('撤回修改失败:', error)
        return false
      }
    }

    console.log('没有可撤回的修改')
    return false
  }

  // 获取原始子图数据的快照
  const createSnapshot = () => {
    return {
      nodes: deepClone(subgraphData.nodes),
      edges: deepClone(subgraphData.edges),
      timestamp: new Date()
    }
  }

  // 恢复到快照状态
  const restoreFromSnapshot = (snapshot) => {
    if (snapshot && snapshot.nodes && snapshot.edges) {
      subgraphData.nodes = deepClone(snapshot.nodes)
      subgraphData.edges = deepClone(snapshot.edges)
      subgraphData.metadata.lastModified = new Date()
      console.log('已恢复到快照状态')
      return true
    }
    return false
  }

  // 保存子图修改状态
  const saveSubgraphModificationState = (subgraphId, modificationData) => {
    subgraphModificationStates.set(subgraphId, {
      hasModifications: true,
      modificationData: modificationData,
      timestamp: new Date()
    })
    console.log(`已保存子图 ${subgraphId} 的修改状态`)
  }

  // 获取子图修改状态
  const getSubgraphModificationState = (subgraphId) => {
    return subgraphModificationStates.get(subgraphId)
  }

  // 清除子图修改状态
  const clearSubgraphModificationState = (subgraphId) => {
    subgraphModificationStates.delete(subgraphId)
    console.log(`已清除子图 ${subgraphId} 的修改状态`)
  }

  // 进入子图编辑时清除高亮
  const enterSubgraphEditMode = () => {
    console.log('进入子图编辑模式，清除所有高亮效果')

    // 清除节点的高亮状态
    subgraphData.nodes.forEach(node => {
      // 清除样式类
      if (node.class) {
        node.class = node.class.replace(/\s*(modified-node|newly-added-node|highlight-temp|highlighted|subgraph-highlighted)/g, '')
      }

      // 清除数据属性中的高亮状态
      if (node.data) {
        node.data.highlighted = false
        node.data.subgraphHighlighted = false
        node.data.dimmed = false
        node.data.isModified = false
        node.data.isNewlyAdded = false
      }
    })

    // 清除边的高亮状态
    subgraphData.edges.forEach(edge => {
      // 清除样式类
      if (edge.class) {
        edge.class = edge.class.replace(/\s*(modified-edge|newly-added-edge|highlight-temp|highlighted|subgraph-highlighted)/g, '')
      }

      // 清除边级别的高亮属性
      edge.highlighted = false
      edge.subgraphHighlighted = false
      edge.dimmed = false

      // 清除数据属性中的高亮状态
      if (edge.data) {
        edge.data.highlighted = false
        edge.data.subgraphHighlighted = false
        edge.data.dimmed = false
        edge.data.isModified = false
        edge.data.isNewlyAdded = false
      }
    })

    console.log('已清除所有高亮效果，子图进入纯净编辑模式')
  }

  // 退出子图编辑时恢复高亮
  const exitSubgraphEditMode = (subgraphId) => {
    console.log('退出子图编辑模式，准备恢复高亮效果')
    const modificationState = getSubgraphModificationState(subgraphId)
    if (modificationState && modificationState.hasModifications) {
      console.log(`子图 ${subgraphId} 有修改，将在返回整体图时恢复高亮`)
      return modificationState.modificationData
    }
    return null
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
    showDifferenceComparison,
    undoLastModification,
    createSnapshot,
    restoreFromSnapshot,
    saveSubgraphModificationState,
    getSubgraphModificationState,
    clearSubgraphModificationState,
    enterSubgraphEditMode,
    exitSubgraphEditMode
  }
}