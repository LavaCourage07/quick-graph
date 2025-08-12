<template>
  <div class="final-canvas">
    <!-- 头部工具栏 -->
    <CanvasHeader
      v-model:search-query="searchQuery"
      v-model:subgraph-query="subgraphSearchState.query"
      :search-results="searchResults"
      :subgraph-results="subgraphSearchState.results"
      :subgraph-active="hasSubgraphHighlight"
      :subgraph-stats="subgraphSearchState.statistics"
      @search="handleSearch"
      @subgraph-search="handleSubgraphSearch"
      @select-node="handleSelectNode"
      @select-subgraph-node="handleSelectNodeForSubgraph"
      @clear-all="handleClearAllSearches"
      @focus-edit="handleEnterFocusEditMode"
      @overview="handleReturnToOverview"
    />

    <!-- VueFlow 画布 -->
    <VueFlowCanvas
      ref="vueFlowCanvasRef"
      v-model="canvasData"
      @elements-changed="handleElementsChanged"
      @node-click="handleNodeClick"
      @edge-click="handleEdgeClick"
    />

    <!-- 工具栏 -->
    <div class="canvas-toolbar">
      <button class="tool-btn" @click="addNode"><span>+</span> 添加节点</button>
      <button class="tool-btn" @click="addEdge"><span>→</span> 添加连线</button>
      <button class="tool-btn" @click="togglePanel('nodes')">
        <span>📋</span> 节点列表
      </button>
      <button class="tool-btn" @click="togglePanel('edges')">
        <span>🔗</span> 边列表
      </button>
      <button class="tool-btn" @click="fitView">
        <span>🔍</span> 适应画布
      </button>
    </div>

    <!-- 信息面板 -->
    <InfoPanel
      v-if="showPanel"
      :panel-type="panelType"
      :nodes="canvasData.nodes"
      :edges="canvasData.edges"
      @select-node="selectNode"
      @select-edge="selectEdge"
      @enhance-node="enhanceNode"
      @enhance-edge="enhanceEdge"
      @close="hidePanel"
    />
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import CanvasHeader from "./CanvasHeader.vue";
import VueFlowCanvas from "./VueFlowCanvas.vue";
import InfoPanel from "./InfoPanel.vue";
import { useCanvasSearch } from "../composables/useCanvasSearch.js";
import { useCanvasOperations } from "../composables/useCanvasOperations.js";

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ nodes: [], edges: [] }),
  },
});

const emit = defineEmits([
  "update:modelValue",
  "elements-changed",
  "enter-focus-edit",
]);

// 使用composables
const {
  searchQuery,
  searchResults,
  subgraphSearchState,
  performSearch,
  performSubgraphSearch,
  selectNodeForSubgraph,
  applySubgraphHighlight,
  clearAllSearches,
  restoreHighlight,
} = useCanvasSearch();

const {
  showPanel,
  panelType,
  selectNode,
  selectEdge,
  enhanceNode,
  enhanceEdge,
  togglePanel,
  hidePanel,
} = useCanvasOperations();

// 画布引用
const vueFlowCanvasRef = ref(null);

// 画布数据
const canvasData = ref({ nodes: [], edges: [] });

// 计算属性：检测是否有子图高亮
const hasSubgraphHighlight = computed(() => {
  return canvasData.value.nodes.some(
    (node) => node.data?.subgraphHighlighted === true
  );
});

// 监听props变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue.nodes && newValue.edges) {
      canvasData.value = { ...newValue };
    }
  },
  { immediate: true, deep: true }
);

// 监听画布数据变化 - 添加防抖避免频繁更新
let canvasUpdateTimeout = null;
watch(
  canvasData,
  (newData) => {
    if (canvasUpdateTimeout) {
      clearTimeout(canvasUpdateTimeout);
    }

    canvasUpdateTimeout = setTimeout(() => {
      emit("update:modelValue", newData);
    }, 50);
  },
  { deep: true }
);

// 处理搜索
const handleSearch = () => {
  performSearch(canvasData.value.nodes);
};

// 处理选择节点（单节点高亮3秒）
const handleSelectNode = (nodeId) => {
  console.log("=== 开始处理节点选择 ===");
  console.log("选择的节点ID:", nodeId);
  console.log("当前画布数据:", canvasData.value);

  // 清除搜索结果和查询
  searchResults.value = [];
  searchQuery.value = "";

  // 直接修改现有数据，确保响应式更新
  canvasData.value.nodes.forEach((node) => {
    if (!node.data) node.data = {};
    node.data.highlighted = node.id === nodeId;
    node.data.subgraphHighlighted = false;
    node.data.dimmed = false;
    console.log(`节点 ${node.id} 高亮设置为:`, node.data.highlighted);
  });

  canvasData.value.edges.forEach((edge) => {
    edge.subgraphHighlighted = false;
    edge.dimmed = false;
    if (!edge.data) edge.data = {};
    edge.data.subgraphHighlighted = false;
    edge.data.dimmed = false;
  });

  // 触发响应式更新
  canvasData.value = { ...canvasData.value };
  console.log("=== 节点选择处理完成 ===");

  // 3秒后自动清除高亮
  setTimeout(() => {
    console.log("=== 开始清除高亮 ===");
    canvasData.value.nodes.forEach((node) => {
      if (node.data) {
        node.data.highlighted = false;
      }
    });
    canvasData.value = { ...canvasData.value };
    console.log("=== 高亮清除完成 ===");
  }, 3000);
};

// 处理子图搜索
const handleSubgraphSearch = () => {
  performSubgraphSearch(canvasData.value.nodes);
};

// 处理选择节点进行子图搜索
const handleSelectNodeForSubgraph = (nodeId) => {
  console.log("=== 开始处理子图选择 ===");
  console.log("选择的节点ID:", nodeId);

  const subgraph = selectNodeForSubgraph(
    nodeId,
    canvasData.value.nodes,
    canvasData.value.edges
  );

  console.log("计算出的子图:", subgraph);

  // 清除子图搜索结果和查询
  subgraphSearchState.results = [];
  subgraphSearchState.query = "";

  // 直接修改现有数据，确保响应式更新
  canvasData.value.nodes.forEach((node) => {
    const isInSubgraph = subgraph.nodes.includes(node.id);
    if (!node.data) node.data = {};
    node.data.highlighted = false;
    node.data.subgraphHighlighted = isInSubgraph;
    node.data.dimmed = !isInSubgraph;
    console.log(
      `节点 ${node.id} 子图高亮:`,
      isInSubgraph,
      "淡化:",
      !isInSubgraph
    );
  });

  canvasData.value.edges.forEach((edge) => {
    const isInSubgraph = subgraph.edges.includes(edge.id);
    edge.subgraphHighlighted = isInSubgraph;
    edge.dimmed = !isInSubgraph;
    if (!edge.data) edge.data = {};
    edge.data.subgraphHighlighted = isInSubgraph;
    edge.data.dimmed = !isInSubgraph;
    console.log(
      `边 ${edge.id} 子图高亮:`,
      isInSubgraph,
      "淡化:",
      !isInSubgraph
    );
  });

  // 触发响应式更新
  canvasData.value = { ...canvasData.value };

  // 确保子图状态正确更新
  subgraphSearchState.isActive = true;
  subgraphSearchState.selectedNode = nodeId;

  console.log("=== 子图选择处理完成 ===");
  console.log("子图状态:", subgraphSearchState.isActive);
  console.log("有子图高亮:", hasSubgraphHighlight.value);
};

// 处理清除所有搜索（只清除搜索框，不清除子图高亮）
const handleClearAllSearches = () => {
  // 只清除搜索相关状态，不清除子图高亮
  searchResults.value = [];
  searchQuery.value = "";
  subgraphSearchState.results = [];
  subgraphSearchState.query = "";

  console.log("清除搜索框，保持子图高亮状态");
};

// 处理返回概览（清除所有高亮状态）
const handleReturnToOverview = () => {
  console.log("=== 开始返回整体概览 ===");

  // 清除所有搜索状态
  clearAllSearches();

  // 清除所有节点的高亮
  canvasData.value.nodes.forEach((node) => {
    if (!node.data) node.data = {};
    node.data.highlighted = false;
    node.data.subgraphHighlighted = false;
    node.data.dimmed = false;
  });

  // 清除所有边的高亮
  canvasData.value.edges.forEach((edge) => {
    edge.subgraphHighlighted = false;
    edge.dimmed = false;
    if (!edge.data) edge.data = {};
    edge.data.subgraphHighlighted = false;
    edge.data.dimmed = false;
  });

  // 重置子图状态
  subgraphSearchState.isActive = false;
  subgraphSearchState.selectedNode = null;
  subgraphSearchState.subgraph = { nodes: [], edges: [] };
  subgraphSearchState.statistics = { nodeCount: 0, edgeCount: 0 };

  // 触发响应式更新
  canvasData.value = { ...canvasData.value };

  // 适应画布
  if (vueFlowCanvasRef.value) {
    vueFlowCanvasRef.value.fitView();
  }

  console.log("=== 返回整体概览完成 ===");
  console.log("有子图高亮:", hasSubgraphHighlight.value);
};

// 处理进入聚焦编辑模式
const handleEnterFocusEditMode = () => {
  console.log("=== 尝试进入聚焦编辑模式 ===");
  console.log("subgraphSearchState.isActive:", subgraphSearchState.isActive);
  console.log("hasSubgraphHighlight:", hasSubgraphHighlight.value);

  // 检查是否有子图高亮，而不是只检查isActive状态
  if (!hasSubgraphHighlight.value) {
    console.error("没有激活的子图高亮");
    return;
  }

  // 如果subgraphSearchState没有正确设置，尝试从画布数据重建
  if (!subgraphSearchState.isActive || !subgraphSearchState.selectedNode) {
    console.log("重建子图状态...");
    const highlightedNodes = canvasData.value.nodes.filter(
      (node) => node.data?.subgraphHighlighted
    );
    const highlightedEdges = canvasData.value.edges.filter(
      (edge) => edge.subgraphHighlighted
    );

    if (highlightedNodes.length === 0) {
      console.error("没有找到高亮的节点");
      return;
    }

    // 找到中心节点（假设是第一个高亮节点）
    const centerNode = highlightedNodes[0];

    // 重建子图状态
    subgraphSearchState.isActive = true;
    subgraphSearchState.selectedNode = centerNode.id;
    subgraphSearchState.subgraph = {
      nodes: highlightedNodes.map((n) => n.id),
      edges: highlightedEdges.map((e) => e.id),
    };
    subgraphSearchState.statistics = {
      nodeCount: highlightedNodes.length,
      edgeCount: highlightedEdges.length,
    };

    console.log("子图状态重建完成:", subgraphSearchState);
  }

  const savedHighlightState = {
    isActive: subgraphSearchState.isActive,
    selectedNode: subgraphSearchState.selectedNode,
    subgraph: { ...subgraphSearchState.subgraph },
    statistics: { ...subgraphSearchState.statistics },
    query: subgraphSearchState.query,
  };

  const subgraphNodes = canvasData.value.nodes.filter((node) =>
    savedHighlightState.subgraph.nodes.includes(node.id)
  );
  const subgraphEdges = canvasData.value.edges.filter((edge) =>
    savedHighlightState.subgraph.edges.includes(edge.id)
  );

  emit("enter-focus-edit", {
    subgraphData: {
      nodes: subgraphNodes,
      edges: subgraphEdges,
      centerNodeId: savedHighlightState.selectedNode,
    },
    originalData: {
      nodes: canvasData.value.nodes,
      edges: canvasData.value.edges,
    },
    savedHighlightState,
  });
};

// 处理元素变化
const handleElementsChanged = (newElements) => {
  emit("elements-changed", newElements);
};

// 工具栏功能
const addNode = () => {
  const newNode = {
    id: `node-${Date.now()}`,
    type: "custom",
    position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
    data: {
      label: `新节点${canvasData.value.nodes.length + 1}`,
      highlighted: false,
      subgraphHighlighted: false,
      dimmed: false,
    },
  };

  canvasData.value.nodes.push(newNode);
  canvasData.value = { ...canvasData.value };
};

const addEdge = () => {
  const nodes = canvasData.value.nodes;
  if (nodes.length < 2) {
    alert("至少需要2个节点才能添加连线");
    return;
  }

  // 简单示例：连接前两个节点
  const sourceNode = nodes[0];
  const targetNode = nodes[1];

  const newEdge = {
    id: `edge-${Date.now()}`,
    source: sourceNode.id,
    target: targetNode.id,
    type: "bezier",
    label: "关系",
    data: {
      subgraphHighlighted: false,
      dimmed: false,
    },
  };

  canvasData.value.edges.push(newEdge);
  canvasData.value = { ...canvasData.value };
};

const fitView = () => {
  if (vueFlowCanvasRef.value) {
    vueFlowCanvasRef.value.fitView();
  }
};

// 处理节点和边的点击事件
const handleNodeClick = ({ node }) => {
  selectNode(node);

  // 如果面板未显示，则显示节点面板
  if (!showPanel.value) {
    togglePanel("nodes");
  }
};

const handleEdgeClick = ({ edge }) => {
  selectEdge(edge);

  // 如果面板未显示，则显示边面板
  if (!showPanel.value) {
    togglePanel("edges");
  }
};

// 自定义的恢复高亮方法
const customRestoreHighlight = (savedState) => {
  console.log("=== 开始恢复高亮状态 ===");
  console.log("保存的状态:", savedState);

  if (savedState && savedState.isActive) {
    // 恢复子图搜索状态
    subgraphSearchState.isActive = savedState.isActive;
    subgraphSearchState.selectedNode = savedState.selectedNode;
    subgraphSearchState.subgraph = { ...savedState.subgraph };
    subgraphSearchState.statistics = { ...savedState.statistics };
    subgraphSearchState.query = savedState.query || "";

    // 应用高亮到画布数据
    canvasData.value.nodes.forEach((node) => {
      const isInSubgraph = savedState.subgraph.nodes.includes(node.id);
      if (!node.data) node.data = {};
      node.data.highlighted = false;
      node.data.subgraphHighlighted = isInSubgraph;
      node.data.dimmed = !isInSubgraph;
    });

    canvasData.value.edges.forEach((edge) => {
      const isInSubgraph = savedState.subgraph.edges.includes(edge.id);
      edge.subgraphHighlighted = isInSubgraph;
      edge.dimmed = !isInSubgraph;
      if (!edge.data) edge.data = {};
      edge.data.subgraphHighlighted = isInSubgraph;
      edge.data.dimmed = !isInSubgraph;
    });

    // 触发响应式更新
    canvasData.value = { ...canvasData.value };

    console.log("=== 高亮状态恢复完成 ===");
    console.log("subgraphSearchState.isActive:", subgraphSearchState.isActive);
    console.log(
      "subgraphSearchState.selectedNode:",
      subgraphSearchState.selectedNode
    );
    console.log("有子图高亮:", hasSubgraphHighlight.value);
  } else {
    console.log("没有有效的保存状态或状态不活跃");
  }
};

// 暴露方法
defineExpose({
  getElements: () => canvasData.value,
  setElements: (newElements) => {
    canvasData.value = newElements;
  },
  restoreHighlight: customRestoreHighlight,
  fitView: () => vueFlowCanvasRef.value?.fitView(),
});
</script>

<style scoped>
.final-canvas {
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 工具栏样式 */
.canvas-toolbar {
  position: absolute;
  top: 80px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
}

.tool-btn {
  padding: 8px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tool-btn:hover {
  background: #f0f0f0;
  border-color: #4068d4;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.tool-btn span {
  font-weight: bold;
  color: #4068d4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .canvas-toolbar {
    flex-direction: row;
    flex-wrap: wrap;
    top: 140px;
    left: 10px;
    right: 10px;
    justify-content: center;
  }

  .tool-btn {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
}
</style>
