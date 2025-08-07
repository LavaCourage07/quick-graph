<template>
  <div class="sketch-canvas">
    <VueFlow
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

    <!-- 工具栏 -->
    <div class="toolbar">
      <button class="tool-btn" @click="addNode"><span>+</span> 添加节点</button>
      <button class="tool-btn" @click="addEdge"><span>→</span> 添加连线</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { VueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import { SmoothStepEdge, BezierEdge } from "@vue-flow/core";
import CustomNode from "./CustomNode.vue";
import CustomEdge from "./CustomEdge.vue";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import "@vue-flow/controls/dist/style.css";
import "@vue-flow/minimap/dist/style.css";

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ nodes: [], edges: [] }),
  },
});

const emit = defineEmits(["update:modelValue", "elements-changed"]);

const elements = ref([]);

// 定义节点类型
const nodeTypes = {
  custom: CustomNode,
};

// 定义边类型
const edgeTypes = {
  smoothstep: SmoothStepEdge,
  bezier: CustomEdge,
};

// 监听props变化，更新elements（只在初始化时更新）
let hasInitialized = false;

watch(
  () => props.modelValue,
  (newValue) => {
    console.log("SketchCanvas 接收到props变化:", newValue);

    // 只在初始化时或者elements为空时从props更新
    if (
      newValue &&
      newValue.nodes &&
      newValue.edges &&
      (!hasInitialized || elements.value.length === 0)
    ) {
      console.log(
        "从父组件初始化elements - 节点数量:",
        newValue.nodes.length,
        "边数量:",
        newValue.edges.length
      );

      elements.value = [...newValue.nodes, ...newValue.edges];
      hasInitialized = true;

      // 分别检查节点和边
      const nodeElements = elements.value.filter(
        (el) => !el.source && !el.target
      );
      const edgeElements = elements.value.filter(
        (el) => el.source && el.target
      );
      console.log(
        "初始化后 - 节点元素数量:",
        nodeElements.length,
        "边元素数量:",
        edgeElements.length
      );
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

    console.log("SketchCanvas elements变化:", {
      totalElements: newElements.length,
      nodes: nodes.length,
      edges: edges.length,
      nodeIds: nodes.map((n) => n.id),
      edgeIds: edges.map((e) => e.id),
    });

    const result = { nodes, edges };
    console.log("向父组件发送数据:", {
      nodes: result.nodes.length,
      edges: result.edges.length,
      nodeDetails: result.nodes.map((n) => ({
        id: n.id,
        label: n.data?.label,
      })),
      edgeDetails: result.edges.map((e) => ({ id: e.id, label: e.label })),
    });
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

// 添加节点
const addNode = () => {
  const newNode = {
    id: `node-${Date.now()}`,
    position: { x: Math.random() * 400, y: Math.random() * 300 },
    data: { label: "新节点" },
    type: "custom",
  };
  elements.value.push(newNode);
};



// 添加边
const addEdge = () => {
  // 这里可以实现添加边的逻辑，比如选择两个节点
  console.log("添加边功能待实现");
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
.sketch-canvas {
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
</style>
