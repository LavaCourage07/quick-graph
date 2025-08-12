import { ref, reactive } from 'vue'

export function useCanvasSearch() {
  // 搜索状态
  const searchQuery = ref("")
  const searchResults = ref([])
  const highlightedNodes = ref([])

  // 子图搜索状态
  const subgraphSearchState = reactive({
    query: "",
    results: [],
    selectedNode: null,
    isActive: false,
    subgraph: { nodes: [], edges: [] },
    statistics: { nodeCount: 0, edgeCount: 0 },
  })

  // 子图搜索防抖
  let subgraphSearchTimeout = null

  // 搜索功能 - 只返回搜索结果，不自动高亮
  const performSearch = (nodes) => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) {
      searchResults.value = []
      return
    }

    const matchedNodes = nodes.filter((node) => {
      const label = node.data?.label?.toLowerCase() || ""
      return label.includes(query)
    })

    searchResults.value = matchedNodes
  }

  // 子图搜索功能
  const performSubgraphSearch = (nodes) => {
    if (subgraphSearchTimeout) {
      clearTimeout(subgraphSearchTimeout)
    }

    subgraphSearchTimeout = setTimeout(() => {
      const query = subgraphSearchState.query.trim().toLowerCase()
      if (!query) {
        subgraphSearchState.results = []
        return
      }

      const matchedNodes = nodes.filter((node) => {
        const label = node.data?.label?.toLowerCase() || ""
        return label.includes(query)
      })

      subgraphSearchState.results = matchedNodes
    }, 300)
  }

  // 选择节点进行子图搜索
  const selectNodeForSubgraph = (nodeId, nodes, edges) => {
    const subgraph = calculateSubgraph(nodeId, nodes, edges)
    
    subgraphSearchState.selectedNode = nodeId
    subgraphSearchState.isActive = true
    subgraphSearchState.subgraph = subgraph
    subgraphSearchState.statistics = {
      nodeCount: subgraph.nodes.length,
      edgeCount: subgraph.edges.length,
    }

    return subgraph
  }

  // 子图计算
  const calculateSubgraph = (selectedNodeId, nodes, edges) => {
    const subgraphNodes = new Set([selectedNodeId])
    const subgraphEdges = new Set()

    edges.forEach((edge) => {
      if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
        subgraphEdges.add(edge.id)
        const connectedNodeId =
          edge.source === selectedNodeId ? edge.target : edge.source
        subgraphNodes.add(connectedNodeId)
      }
    })

    return {
      nodes: Array.from(subgraphNodes),
      edges: Array.from(subgraphEdges),
    }
  }

  // 高亮功能
  const highlightNodes = (matchedNodes, allNodes) => {
    clearHighlight(allNodes)
    highlightedNodes.value = matchedNodes.map((n) => n.id)
    
    // 应用高亮到所有节点
    allNodes.forEach((node) => {
      if (!node.data) node.data = {}
      node.data.highlighted = highlightedNodes.value.includes(node.id)
      node.data.subgraphHighlighted = false
      node.data.dimmed = false
    })
    
    return highlightedNodes.value
  }

  const applySubgraphHighlight = (subgraph, elements) => {
    elements.forEach((element) => {
      if (!element.source && !element.target) {
        // 节点
        const isInSubgraph = subgraph.nodes.includes(element.id)
        if (!element.data) element.data = {}
        element.data.subgraphHighlighted = isInSubgraph
        element.data.dimmed = !isInSubgraph
        element.data.highlighted = false
      } else {
        // 边
        const isInSubgraph = subgraph.edges.includes(element.id)
        element.subgraphHighlighted = isInSubgraph
        element.dimmed = !isInSubgraph
        if (!element.data) element.data = {}
        element.data.subgraphHighlighted = isInSubgraph
        element.data.dimmed = !isInSubgraph
      }
    })
  }

  const clearHighlight = (allNodes = []) => {
    highlightedNodes.value = []
    
    // 清除所有节点的高亮状态
    allNodes.forEach((node) => {
      if (node.data) {
        node.data.highlighted = false
        node.data.subgraphHighlighted = false
        node.data.dimmed = false
      }
    })
  }

  const clearAllSearches = () => {
    searchQuery.value = ""
    searchResults.value = []
    subgraphSearchState.query = ""
    subgraphSearchState.results = []
    subgraphSearchState.isActive = false
    subgraphSearchState.selectedNode = null
    subgraphSearchState.subgraph = { nodes: [], edges: [] }
    subgraphSearchState.statistics = { nodeCount: 0, edgeCount: 0 }
    clearHighlight()
  }

  // 恢复高亮状态
  const restoreHighlight = (savedState) => {
    if (savedState) {
      subgraphSearchState.isActive = savedState.isActive
      subgraphSearchState.selectedNode = savedState.selectedNode
      subgraphSearchState.subgraph = { ...savedState.subgraph }
      subgraphSearchState.statistics = { ...savedState.statistics }
      subgraphSearchState.query = savedState.query
      searchQuery.value = savedState.query
    }
  }

  return {
    // 状态
    searchQuery,
    searchResults,
    highlightedNodes,
    subgraphSearchState,
    
    // 方法
    performSearch,
    performSubgraphSearch,
    selectNodeForSubgraph,
    calculateSubgraph,
    highlightNodes,
    applySubgraphHighlight,
    clearHighlight,
    clearAllSearches,
    restoreHighlight,
  }
}
