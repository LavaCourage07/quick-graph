<template>
  <div class="final-canvas">
    <VueFlow
      ref="vueFlowInstance"
      v-model="elements"
      :default-viewport="{ zoom: 1 }"
      :min-zoom="0.2"
      :max-zoom="4"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :connection-mode="'loose'"
      :snap-to-grid="false"
      class="vueflow-canvas"
      @node-drag-stop="onNodeDragStop"
      @connect="onConnect"
      @nodes-delete="onNodesDelete"
      @edges-delete="onEdgesDelete"
    >
      <Background />
      <Controls />
      <MiniMap />
    </VueFlow>

    <!-- 信息面板 -->
    <div v-if="showPanel" class="panel">
      <div class="panel-header">
        {{ panelTitle }}
      </div>
      <div class="panel-content">
        <div v-if="panelType === 'nodes'" class="nodes-list">
          <div
            v-for="node in nodes"
            :key="node.id"
            class="node-item"
            @click="selectNode(node)"
          >
            <div class="item-header">
              <h4>{{ node.data.label }}</h4>
              <span v-if="node.data.englishName" class="english-name">{{
                node.data.englishName
              }}</span>
            </div>

            <div v-if="node.data.description" class="description">
              {{ node.data.description }}
            </div>

            <div
              v-if="node.data.parameters && node.data.parameters.length"
              class="parameters"
            >
              <h5>技术参数：</h5>
              <ul>
                <li v-for="param in node.data.parameters" :key="param">
                  {{ param }}
                </li>
              </ul>
            </div>

            <div
              v-if="node.data.features && node.data.features.length"
              class="features"
            >
              <h5>功能特点：</h5>
              <ul>
                <li v-for="feature in node.data.features" :key="feature">
                  {{ feature }}
                </li>
              </ul>
            </div>

            <button class="enhance-btn" @click.stop="enhanceNode(node)">
              重新完善
            </button>
          </div>
        </div>

        <div v-else-if="panelType === 'edges'" class="edges-list">
          <div
            v-for="edge in edges"
            :key="edge.id"
            class="edge-item"
            @click="selectEdge(edge)"
          >
            <div class="item-header">
              <h4>{{ edge.label }}</h4>
              <span
                v-if="edge.data && edge.data.englishName"
                class="english-name"
                >{{ edge.data.englishName }}</span
              >
            </div>

            <div v-if="edge.data && edge.data.description" class="description">
              {{ edge.data.description }}
            </div>

            <div
              v-if="
                edge.data && edge.data.parameters && edge.data.parameters.length
              "
              class="parameters"
            >
              <h5>技术参数：</h5>
              <ul>
                <li v-for="param in edge.data.parameters" :key="param">
                  {{ param }}
                </li>
              </ul>
            </div>

            <div
              v-if="
                edge.data && edge.data.features && edge.data.features.length
              "
              class="features"
            >
              <h5>功能特点：</h5>
              <ul>
                <li v-for="feature in edge.data.features" :key="feature">
                  {{ feature }}
                </li>
              </ul>
            </div>

            <button class="enhance-btn" @click.stop="enhanceEdge(edge)">
              重新完善
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 双搜索框容器 -->
    <div class="search-container">
      <!-- 原有节点搜索框 -->
      <div class="search-section">
        <div class="search-label">搜索节点（本体）</div>
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="输入节点名称..."
            class="search-input"
            @input="onSearchInput"
            @keyup.enter="performSearch"
          />
          <button class="search-btn" @click="performSearch">🔍</button>
        </div>
        <div v-if="searchResults.length > 0" class="search-results">
          找到 {{ searchResults.length }} 个匹配的节点
        </div>
      </div>

      <!-- 子图高亮搜索框 -->
      <div class="search-section subgraph-search">
        <div class="search-label">子图高亮搜索</div>
        <div class="search-box">
          <input
            v-model="subgraphSearchState.query"
            type="text"
            placeholder="搜索节点创建子图..."
            class="search-input"
            @input="onSubgraphSearchInput"
            @keyup.enter="performSubgraphSearch"
          />
          <button class="search-btn" @click="performSubgraphSearch">🎯</button>
        </div>
        <div
          v-if="subgraphSearchState.results.length > 0"
          class="subgraph-search-results"
        >
          <div class="results-header">选择节点创建子图：</div>
          <div class="results-list">
            <div
              v-for="node in subgraphSearchState.results"
              :key="node.id"
              class="result-item"
              @click="selectNodeForSubgraph(node.id)"
            >
              {{ node.data.label }}
            </div>
          </div>
        </div>
        <div
          v-else-if="
            subgraphSearchState.query.trim() &&
            subgraphSearchState.results.length === 0
          "
          class="no-results"
        >
          未找到匹配节点
        </div>
      </div>

      <!-- 子图统计信息 -->
      <div v-if="subgraphSearchState.isActive" class="subgraph-stats">
        <div class="stats-header">当前子图</div>
        <div class="stats-content">
          <span class="stats-item"
            >节点: {{ subgraphSearchState.statistics.nodeCount }}</span
          >
          <span class="stats-item"
            >边: {{ subgraphSearchState.statistics.edgeCount }}</span
          >
        </div>
        <button class="overview-btn" @click="returnToOverview">
          回到整体概览
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, nextTick } from "vue";
import { VueFlow, useVueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import { SmoothStepEdge, BezierEdge } from "@vue-flow/core";
import CustomNode from "./CustomNode.vue";
import RectNode from "./RectNode.vue";
import CustomEdge from "./CustomEdge.vue";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import "@vue-flow/controls/dist/style.css";
import "@vue-flow/minimap/dist/style.css";
import { kimiAPI } from "../api/kimi.js";

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ nodes: [], edges: [] }),
  },
});

const emit = defineEmits(["update:modelValue", "elements-changed"]);

const elements = ref([]);
const showPanel = ref(false);
const panelType = ref("nodes");
const selectedItem = ref(null);

// 原有节点搜索相关状态
const searchQuery = ref("");
const searchResults = ref([]);
const highlightedNodes = ref([]);

// 子图搜索相关状态
const subgraphSearchState = reactive({
  query: "", // 搜索关键词
  results: [], // 搜索结果节点列表
  selectedNode: null, // 选中的节点
  isActive: false, // 子图高亮是否激活
  subgraph: {
    // 计算出的子图
    nodes: [], // 子图节点ID列表
    edges: [], // 子图边ID列表
  },
  statistics: {
    // 子图统计信息
    nodeCount: 0,
    edgeCount: 0,
  },
});

// 高亮状态管理
const highlightState = reactive({
  mode: "none", // 'none' | 'node' | 'subgraph'
  nodeHighlight: {
    // 原有节点高亮
    nodes: [],
    timeout: null,
  },
  subgraphHighlight: {
    // 子图高亮
    nodes: [],
    edges: [],
    centerNode: null,
  },
});

// VueFlow实例引用
const vueFlowInstance = ref(null);

// 使用VueFlow的composable API
const { setNodes, setEdges, updateNodeData, getNodes, getEdges } = useVueFlow();

// 定义节点类型
const nodeTypes = {
  custom: CustomNode,
  rect: RectNode,
};

// 定义边类型
const edgeTypes = {
  smoothstep: SmoothStepEdge,
  bezier: CustomEdge,
};

const nodes = computed(() =>
  elements.value.filter((el) => !el.source && !el.target)
);
const edges = computed(() =>
  elements.value.filter((el) => el.source && el.target)
);

const panelTitle = computed(() => {
  return panelType.value === "nodes" ? "节点列表" : "边列表";
});

// 监听props变化，更新elements
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue.nodes && newValue.edges) {
      // 正常加载节点，不设置高亮状态
      elements.value = [...newValue.nodes, ...newValue.edges];

      // 使用VueFlow的官方API更新节点数据
      nextTick(() => {
        try {
          console.log("使用VueFlow官方API更新节点数据");
          setNodes(newValue.nodes);
          setEdges(newValue.edges);
        } catch (error) {
          console.error("使用VueFlow API失败:", error);
        }
      });
    }
  },
  { immediate: true, deep: true }
);

// 监听elements变化，更新父组件
watch(
  elements,
  (newElements) => {
    const nodes = newElements.filter((el) => !el.source && !el.target);
    const edges = newElements.filter((el) => el.source && el.target);

    const result = { nodes, edges };
    emit("update:modelValue", result);
    emit("elements-changed", result);
  },
  { deep: true }
);

// 节点拖拽结束
const onNodeDragStop = (event, node) => {
  console.log("节点拖拽结束:", node);
};

// 连接节点
const onConnect = (params) => {
  // 自动选择最佳的连接桩
  const sourceNode = elements.value.find((el) => el.id === params.source);
  const targetNode = elements.value.find((el) => el.id === params.target);

  if (sourceNode && targetNode) {
    const { sourceHandle, targetHandle } = getBestHandles(
      sourceNode,
      targetNode
    );

    const newEdge = {
      id: `${params.source}-${params.target}`,
      source: params.source,
      target: params.target,
      sourceHandle: sourceHandle,
      targetHandle: targetHandle,
      label: "关系",
      type: "bezier",
    };
    elements.value.push(newEdge);
  }
};

// 根据节点位置选择最佳连接桩
const getBestHandles = (sourceNode, targetNode) => {
  const dx = targetNode.position.x - sourceNode.position.x;
  const dy = targetNode.position.y - sourceNode.position.y;

  let sourceHandle, targetHandle;

  // 根据相对位置选择连接桩
  if (Math.abs(dx) > Math.abs(dy)) {
    // 水平方向距离更大
    if (dx > 0) {
      sourceHandle = "right";
      targetHandle = "left-target";
    } else {
      sourceHandle = "left";
      targetHandle = "right-target";
    }
  } else {
    // 垂直方向距离更大
    if (dy > 0) {
      sourceHandle = "bottom";
      targetHandle = "top-target";
    } else {
      sourceHandle = "top";
      targetHandle = "bottom-target";
    }
  }

  return { sourceHandle, targetHandle };
};

// 删除节点
const onNodesDelete = (nodes) => {
  console.log("删除节点:", nodes);
};

// 删除边
const onEdgesDelete = (edges) => {
  console.log("删除边:", edges);
};

// 切换面板
const togglePanel = (type) => {
  if (panelType.value === type && showPanel.value) {
    showPanel.value = false;
  } else {
    panelType.value = type;
    showPanel.value = true;
  }
};

// 选择节点
const selectNode = (node) => {
  selectedItem.value = node;
};

// 选择边
const selectEdge = (edge) => {
  selectedItem.value = edge;
};

// 完善节点信息
const enhanceNode = async (node) => {
  try {
    const enhancedInfo = await kimiAPI.enhanceItem(node);
    node.data.description = enhancedInfo;
  } catch (error) {
    console.error("完善节点信息失败:", error);
  }
};

// 完善边信息
const enhanceEdge = async (edge) => {
  try {
    const enhancedInfo = await kimiAPI.enhanceItem(edge);
    if (!edge.data) {
      edge.data = {};
    }
    edge.data.description = enhancedInfo;
  } catch (error) {
    console.error("完善边信息失败:", error);
  }
};

// 搜索输入处理
const onSearchInput = () => {
  if (searchQuery.value.trim() === "") {
    clearHighlight();
    searchResults.value = [];
  }
};

// 执行搜索
const performSearch = () => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    clearHighlight();
    searchResults.value = [];
    return;
  }

  // 清除子图高亮状态（状态冲突处理）
  if (subgraphSearchState.isActive) {
    clearAllHighlights();
    resetSearchStates();
  }

  // 搜索匹配的节点
  const matchedNodes = nodes.value.filter((node) => {
    const label = node.data.label?.toLowerCase() || "";
    return label.includes(query);
  });

  searchResults.value = matchedNodes;

  if (matchedNodes.length > 0) {
    highlightAndCenterNodes(matchedNodes);
  } else {
    clearHighlight();
  }
};

// ===== 子图搜索功能 =====

// 防抖定时器
let subgraphSearchTimeout = null;

// 子图搜索输入处理
const onSubgraphSearchInput = () => {
  if (subgraphSearchState.query.trim() === "") {
    subgraphSearchState.results = [];
    return;
  }

  // 清除之前的防抖定时器
  if (subgraphSearchTimeout) {
    clearTimeout(subgraphSearchTimeout);
  }

  // 设置防抖，300ms后执行搜索
  subgraphSearchTimeout = setTimeout(() => {
    performSubgraphSearch();
  }, 300);
};

// 执行子图搜索
const performSubgraphSearch = () => {
  const query = subgraphSearchState.query.trim().toLowerCase();
  if (!query) {
    subgraphSearchState.results = [];
    return;
  }

  // 搜索匹配的节点
  const matchedNodes = nodes.value.filter((node) => {
    const label = node.data.label?.toLowerCase() || "";
    return label.includes(query);
  });

  subgraphSearchState.results = matchedNodes;
};

// 选择节点创建子图
const selectNodeForSubgraph = (nodeId) => {
  // 清除原有的节点搜索高亮
  clearHighlight();

  // 计算子图
  const subgraph = calculateSubgraph(nodeId, nodes.value, edges.value);

  // 验证子图计算结果
  if (!validateSubgraph(subgraph, nodes.value, edges.value)) {
    console.error("子图计算结果验证失败");
    return;
  }

  // 处理孤立节点的特殊情况
  if (subgraph.edges.length === 0) {
    const isolatedResult = handleIsolatedNode(nodeId, nodes.value);
    if (isolatedResult) {
      subgraph.nodes = isolatedResult.nodes;
      subgraph.edges = isolatedResult.edges;
      subgraph.isIsolated = isolatedResult.isIsolated;
    }
  }

  // 更新子图搜索状态
  subgraphSearchState.selectedNode = nodeId;
  subgraphSearchState.isActive = true;
  subgraphSearchState.subgraph = subgraph;
  subgraphSearchState.statistics = calculateSubgraphStatistics(
    subgraph,
    nodeId
  );

  // 更新高亮状态
  highlightState.mode = "subgraph";
  highlightState.subgraphHighlight.nodes = subgraph.nodes;
  highlightState.subgraphHighlight.edges = subgraph.edges;
  highlightState.subgraphHighlight.centerNode = nodeId;

  // 应用子图高亮效果
  applySubgraphHighlight(subgraph);
};

// 应用子图高亮效果
const applySubgraphHighlight = (subgraph) => {
  elements.value.forEach((element) => {
    if (!element.source && !element.target) {
      // 节点处理
      const isInSubgraph = subgraph.nodes.includes(element.id);
      element.data.subgraphHighlighted = isInSubgraph;
      element.data.dimmed = !isInSubgraph;

      // 清除原有的节点高亮
      element.data.highlighted = false;
    } else {
      // 边处理
      const isInSubgraph = subgraph.edges.includes(element.id);
      element.subgraphHighlighted = isInSubgraph;
      element.dimmed = !isInSubgraph;

      // 同时在data中设置，确保能传递给组件
      if (!element.data) {
        element.data = {};
      }
      element.data.subgraphHighlighted = isInSubgraph;
      element.data.dimmed = !isInSubgraph;
    }
  });

  // 强制触发响应式更新
  const timestamp = Date.now();
  elements.value.forEach((element) => {
    if (!element.source && !element.target) {
      // 节点强制更新
      if (element.data.subgraphHighlighted) {
        element.data._subgraphUpdate = timestamp;
      }
    } else {
      // 边强制更新
      if (element.subgraphHighlighted) {
        element._edgeSubgraphUpdate = timestamp;
      }
    }
  });

  // 立即移除临时属性
  nextTick(() => {
    elements.value.forEach((element) => {
      if (!element.source && !element.target && element.data._subgraphUpdate) {
        delete element.data._subgraphUpdate;
      }
      if (element.source && element.target && element._edgeSubgraphUpdate) {
        delete element._edgeSubgraphUpdate;
      }
    });
  });
};

// 回到整体概览
const returnToOverview = () => {
  console.log("回到整体概览");

  // 清除所有高亮状态
  clearAllHighlights();

  // 适应画布居中
  if (vueFlowInstance.value) {
    try {
      vueFlowInstance.value.fitView({
        padding: 0.1,
        duration: 800,
        maxZoom: 1.5,
        minZoom: 0.3,
      });
      console.log("画布已适应居中");
    } catch (error) {
      console.error("画布适应居中失败:", error);
    }
  }

  // 重置搜索状态
  resetSearchStates();
};

// 清除所有高亮状态
const clearAllHighlights = () => {
  console.log("清除所有高亮状态");

  // 清除节点和边的所有高亮标记
  elements.value.forEach((element) => {
    if (!element.source && !element.target) {
      // 节点处理
      element.data.highlighted = false;
      element.data.subgraphHighlighted = false;
      element.data.dimmed = false;
    } else {
      // 边处理
      element.subgraphHighlighted = false;
      element.dimmed = false;
    }
  });

  // 清除原有节点搜索状态
  highlightedNodes.value = [];

  // 重置高亮状态
  highlightState.mode = "none";
  highlightState.nodeHighlight.nodes = [];
  highlightState.subgraphHighlight.nodes = [];
  highlightState.subgraphHighlight.edges = [];
  highlightState.subgraphHighlight.centerNode = null;
};

// 重置搜索状态
const resetSearchStates = () => {
  console.log("重置搜索状态");

  // 重置子图搜索状态
  subgraphSearchState.query = "";
  subgraphSearchState.results = [];
  subgraphSearchState.selectedNode = null;
  subgraphSearchState.isActive = false;
  subgraphSearchState.subgraph.nodes = [];
  subgraphSearchState.subgraph.edges = [];
  subgraphSearchState.statistics.nodeCount = 0;
  subgraphSearchState.statistics.edgeCount = 0;

  // 保持原有节点搜索状态不变，让用户可以继续使用
};

// ===== 子图搜索功能结束 =====

// 高亮显示匹配的节点
const highlightAndCenterNodes = (matchedNodes) => {
  console.log(
    "高亮节点:",
    matchedNodes.map((n) => n.data.label)
  );

  // 清除之前的高亮
  clearHighlight();

  // 设置新的高亮节点ID列表
  highlightedNodes.value = matchedNodes.map((n) => n.id);

  // 尝试使用VueFlow的官方API更新节点数据
  if (vueFlowInstance.value) {
    try {
      // 获取VueFlow实例的方法
      const { updateNodeData } = vueFlowInstance.value;

      if (updateNodeData) {
        // 先清除所有节点的高亮
        nodes.value.forEach((node) => {
          updateNodeData(node.id, { ...node.data, highlighted: false });
        });

        // 然后设置匹配节点的高亮
        matchedNodes.forEach((node) => {
          console.log("使用VueFlow API设置节点高亮:", node.id, node.data.label);
          updateNodeData(node.id, { ...node.data, highlighted: true });
        });
      } else {
        console.log("VueFlow updateNodeData 方法不可用，使用备用方案");
        useBackupHighlight(matchedNodes);
      }
    } catch (error) {
      console.error("使用VueFlow API失败:", error);
      useBackupHighlight(matchedNodes);
    }
  } else {
    console.log("VueFlow实例不可用，使用备用方案");
    useBackupHighlight(matchedNodes);
  }

  console.log("设置高亮节点ID:", highlightedNodes.value);

  // 3秒后清除高亮
  setTimeout(() => {
    clearHighlight();
  }, 3000);
};

// 备用高亮方案 - 使用强制更新的方法
const useBackupHighlight = (matchedNodes) => {
  console.log("使用备用高亮方案");

  // 先直接修改节点数据
  elements.value.forEach((element) => {
    if (!element.source && !element.target) {
      // 这是一个节点
      if (highlightedNodes.value.includes(element.id)) {
        // 设置高亮
        console.log("备用方案设置节点高亮:", element.id, element.data.label);
        element.data.highlighted = true;
      } else {
        // 移除高亮
        element.data.highlighted = false;
      }
    }
  });

  // 强制触发组件重新渲染
  // 通过修改一个临时属性来触发响应式更新
  const timestamp = Date.now();
  elements.value.forEach((element) => {
    if (!element.source && !element.target && element.data.highlighted) {
      element.data._forceUpdate = timestamp;
    }
  });

  // 立即移除临时属性
  nextTick(() => {
    elements.value.forEach((element) => {
      if (!element.source && !element.target && element.data._forceUpdate) {
        delete element.data._forceUpdate;
      }
    });

    // 验证节点数据是否正确更新
    const highlightedNodesData = elements.value.filter(
      (el) => !el.source && !el.target && el.data.highlighted
    );
    console.log(
      "实际高亮的节点:",
      highlightedNodesData.map((n) => ({
        id: n.id,
        label: n.data.label,
        highlighted: n.data.highlighted,
      }))
    );
  });
};

// 居中显示单个节点
const centerOnNode = (node) => {
  console.log("居中显示节点:", node.data.label, "位置:", node.position);

  if (vueFlowInstance.value) {
    try {
      // 使用 VueFlow 的官方 fitView 方法
      // 这是 VueFlow 推荐的节点居中方法
      vueFlowInstance.value.fitView({
        nodes: [node.id],
        padding: 0.2,
        duration: 800,
        maxZoom: 2,
        minZoom: 0.5,
      });

      console.log("使用 VueFlow 官方 fitView 方法居中显示节点");
    } catch (error) {
      console.error("fitView 失败:", error);

      // 备用方案：使用手动计算的视图变换
      try {
        const currentViewport = vueFlowInstance.value.getViewport();
        const flowContainer = vueFlowInstance.value.$el;
        const containerRect = flowContainer.getBoundingClientRect();

        console.log("使用手动计算备用方案");
        console.log("当前视图:", currentViewport);
        console.log("容器尺寸:", {
          width: containerRect.width,
          height: containerRect.height,
        });

        // 计算容器中心
        const containerCenterX = containerRect.width / 2;
        const containerCenterY = containerRect.height / 2;

        // 计算节点当前屏幕位置
        const nodeScreenX =
          node.position.x * currentViewport.zoom + currentViewport.x;
        const nodeScreenY =
          node.position.y * currentViewport.zoom + currentViewport.y;

        // 计算需要的偏移量
        const offsetX = containerCenterX - nodeScreenX;
        const offsetY = containerCenterY - nodeScreenY;

        // 应用新的视图变换
        const newViewport = {
          x: currentViewport.x + offsetX,
          y: currentViewport.y + offsetY,
          zoom: currentViewport.zoom,
        };

        vueFlowInstance.value.setViewport(newViewport, { duration: 800 });

        console.log("手动计算完成，新视图:", newViewport);
      } catch (manualError) {
        console.error("手动计算也失败:", manualError);
      }
    }
  }
};

// 居中显示指定位置
const centerOnPosition = (x, y) => {
  console.log("居中显示位置:", x, y);

  if (vueFlowInstance.value) {
    try {
      // 手动计算视图变换，让指定位置显示在画布中心
      const viewport = vueFlowInstance.value.getViewport();
      const canvasRect = vueFlowInstance.value.$el.getBoundingClientRect();

      // 计算需要的平移量
      const targetX = canvasRect.width / 2 - x * viewport.zoom;
      const targetY = canvasRect.height / 2 - y * viewport.zoom;

      vueFlowInstance.value.setViewport(
        {
          x: targetX,
          y: targetY,
          zoom: Math.max(0.8, viewport.zoom),
        },
        { duration: 800 }
      );

      console.log("成功居中显示位置");
    } catch (error) {
      console.error("居中显示位置失败:", error);
    }
  }
};

// ===== 子图计算核心算法 =====

// 计算子图：找出与选中节点直接关联的所有节点和边
const calculateSubgraph = (selectedNodeId, nodeList, edgeList) => {
  // 验证输入参数
  if (!selectedNodeId || !nodeList || !edgeList) {
    console.error("calculateSubgraph: 无效的输入参数");
    return { nodes: [], edges: [] };
  }

  // 验证选中的节点是否存在
  const selectedNode = nodeList.find((node) => node.id === selectedNodeId);
  if (!selectedNode) {
    console.error("calculateSubgraph: 找不到选中的节点", selectedNodeId);
    return { nodes: [], edges: [] };
  }

  const subgraphNodes = new Set([selectedNodeId]);
  const subgraphEdges = new Set();

  // 找到所有与选中节点直接相连的边
  edgeList.forEach((edge) => {
    if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
      subgraphEdges.add(edge.id);
      // 添加连接的另一端节点
      const connectedNodeId =
        edge.source === selectedNodeId ? edge.target : edge.source;
      subgraphNodes.add(connectedNodeId);
    }
  });

  return {
    nodes: Array.from(subgraphNodes),
    edges: Array.from(subgraphEdges),
  };
};

// 验证子图计算结果的有效性
const validateSubgraph = (subgraph, nodeList, edgeList) => {
  if (!subgraph || !subgraph.nodes || !subgraph.edges) {
    return false;
  }

  // 验证所有子图节点都存在于原图中
  const nodeIds = new Set(nodeList.map((node) => node.id));
  for (const nodeId of subgraph.nodes) {
    if (!nodeIds.has(nodeId)) {
      console.error("validateSubgraph: 子图包含不存在的节点", nodeId);
      return false;
    }
  }

  // 验证所有子图边都存在于原图中
  const edgeIds = new Set(edgeList.map((edge) => edge.id));
  for (const edgeId of subgraph.edges) {
    if (!edgeIds.has(edgeId)) {
      console.error("validateSubgraph: 子图包含不存在的边", edgeId);
      return false;
    }
  }

  return true;
};

// 处理特殊情况：孤立节点
const handleIsolatedNode = (nodeId, nodeList) => {
  const node = nodeList.find((n) => n.id === nodeId);
  if (!node) {
    return null;
  }

  console.log("处理孤立节点:", nodeId, node.data.label);
  return {
    nodes: [nodeId],
    edges: [],
    isIsolated: true,
  };
};

// 计算子图统计信息
const calculateSubgraphStatistics = (subgraph, centerNodeId) => {
  return {
    nodeCount: subgraph.nodes.length,
    edgeCount: subgraph.edges.length,
    centerNode: centerNodeId,
    isIsolated: subgraph.edges.length === 0,
  };
};

// ===== 子图计算算法结束 =====

// 清除高亮
const clearHighlight = () => {
  // 清除节点数据中的高亮标记
  elements.value.forEach((element) => {
    if (!element.source && !element.target) {
      // 这是一个节点
      element.data.highlighted = false;
    }
  });

  highlightedNodes.value = [];
};

// 暴露方法给父组件
defineExpose({
  getElements: () => elements.value,
  setElements: (newElements) => {
    elements.value = newElements;
  },
});
</script>

<style scoped>
.final-canvas {
  height: 100%;
  position: relative;
}

.vueflow-canvas {
  height: 100%;
}

.toolbar {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 10px;
  z-index: 10;
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
}

.tool-btn:hover {
  background: #f0f0f0;
  border-color: #4068d4;
}

.tool-btn span {
  font-weight: bold;
  color: #4068d4;
}

.enhance-btn {
  margin-top: 8px;
  padding: 4px 8px;
  background: #4068d4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.2s;
}

.enhance-btn:hover {
  background: #3557c0;
}

.nodes-list,
.edges-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.node-item,
.edge-item {
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s;
}

.node-item:hover,
.edge-item:hover {
  background-color: #e8f4fd;
  border-color: #4068d4;
}

.node-item h4,
.edge-item h4 {
  margin-bottom: 5px;
  font-size: 14px;
  color: #333;
}

.node-item p,
.edge-item p {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.panel {
  position: absolute;
  right: 20px;
  top: 20px;
  width: 350px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: calc(100vh - 120px);
  overflow: hidden;
  z-index: 20;
}

.panel-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  font-size: 16px;
  background-color: #f8f9fa;
  color: #333;
}

.panel-content {
  padding: 15px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.item-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.item-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.english-name {
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.description {
  font-size: 12px;
  color: #555;
  line-height: 1.4;
  margin-bottom: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.parameters,
.features {
  margin-bottom: 8px;
}

.parameters h5,
.features h5 {
  margin: 0 0 4px 0;
  font-size: 12px;
  font-weight: 600;
  color: #4068d4;
}

.parameters ul,
.features ul {
  margin: 0;
  padding-left: 16px;
  font-size: 11px;
  color: #666;
}

.parameters li,
.features li {
  margin-bottom: 2px;
  line-height: 1.3;
}

/* 双搜索框样式 */
.search-container {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-section.subgraph-search {
  border-top: 1px solid #e9ecef;
  padding-top: 15px;
}

.search-label {
  font-size: 12px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 4px;
}

.search-box {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-input {
  border: none;
  outline: none;
  padding: 10px 12px;
  font-size: 14px;
  width: 250px;
  background: transparent;
}

.search-input::placeholder {
  color: #999;
}

.search-btn {
  background: #4068d4;
  border: none;
  padding: 10px 12px;
  cursor: pointer;
  color: white;
  font-size: 14px;
  transition: background-color 0.2s;
}

.search-btn:hover {
  background: #3557c0;
}

.search-results {
  margin-top: 8px;
  padding: 6px 12px;
  background: rgba(64, 104, 212, 0.1);
  border: 1px solid rgba(64, 104, 212, 0.2);
  border-radius: 4px;
  font-size: 12px;
  color: #4068d4;
}

/* 子图搜索结果样式 */
.subgraph-search-results {
  margin-top: 8px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.results-header {
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-size: 12px;
  font-weight: 600;
  color: #495057;
}

.results-list {
  max-height: 200px;
  overflow-y: auto;
}

.result-item {
  padding: 10px 12px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  border-bottom: 1px solid #f1f3f4;
  transition: all 0.2s;
}

.result-item:hover {
  background: #e8f4fd;
  color: #4068d4;
}

.result-item:last-child {
  border-bottom: none;
}

.no-results {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.2);
  border-radius: 4px;
  font-size: 12px;
  color: #dc3545;
  text-align: center;
}

/* 子图统计信息样式 */
.subgraph-stats {
  background: white;
  border: 1px solid #28a745;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.stats-header {
  padding: 8px 12px;
  background: rgba(40, 167, 69, 0.1);
  border-bottom: 1px solid rgba(40, 167, 69, 0.2);
  font-size: 12px;
  font-weight: 600;
  color: #28a745;
}

.stats-content {
  padding: 10px 12px;
  display: flex;
  gap: 15px;
}

.stats-item {
  font-size: 12px;
  color: #495057;
  font-weight: 500;
}

.overview-btn {
  width: 100%;
  padding: 8px 12px;
  background: #28a745;
  color: white;
  border: none;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.overview-btn:hover {
  background: #218838;
}

/* 搜索高亮样式 - 使用全局样式 */
:deep(.search-highlighted) {
  animation: blue-highlight-pulse 2s ease-in-out infinite !important;
  border-color: #4068d4 !important;
  box-shadow: 0 0 25px rgba(64, 104, 212, 0.6) !important;
  background: linear-gradient(135deg, #f0f8ff 0%, #e8f4fd 100%) !important;
  transform-origin: center !important;
}

@keyframes blue-highlight-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 25px rgba(64, 104, 212, 0.6);
    border-color: #4068d4;
  }
  50% {
    transform: scale(1.03);
    box-shadow: 0 0 35px rgba(64, 104, 212, 0.8);
    border-color: #3557c0;
  }
}
</style>
