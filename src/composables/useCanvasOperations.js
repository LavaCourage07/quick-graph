import { ref } from 'vue'
import { kimiAPI } from '../api/kimi.js'

export function useCanvasOperations() {
  const showPanel = ref(false)
  const panelType = ref("nodes")
  const selectedItem = ref(null)

  // 面板功能
  const selectNode = (node) => {
    selectedItem.value = node
  }

  const selectEdge = (edge) => {
    selectedItem.value = edge
  }

  const enhanceNode = async (node) => {
    try {
      const enhancedInfo = await kimiAPI.enhanceItem(node)
      if (!node.data) node.data = {}
      node.data.description = enhancedInfo
    } catch (error) {
      console.error("完善节点信息失败:", error)
    }
  }

  const enhanceEdge = async (edge) => {
    try {
      const enhancedInfo = await kimiAPI.enhanceItem(edge)
      if (!edge.data) edge.data = {}
      edge.data.description = enhancedInfo
    } catch (error) {
      console.error("完善边信息失败:", error)
    }
  }

  const togglePanel = (type = "nodes") => {
    panelType.value = type
    showPanel.value = !showPanel.value
  }

  const hidePanel = () => {
    showPanel.value = false
  }

  return {
    // 状态
    showPanel,
    panelType,
    selectedItem,
    
    // 方法
    selectNode,
    selectEdge,
    enhanceNode,
    enhanceEdge,
    togglePanel,
    hidePanel,
  }
}


