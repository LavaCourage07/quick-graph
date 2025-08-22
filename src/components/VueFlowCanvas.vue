<template>
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
    @node-click="onNodeClick"
    @edge-click="onEdgeClick"
    @connect="onConnect"
    @nodes-delete="onNodesDelete"
    @edges-delete="onEdgesDelete"
  >
    <Background />
    <Controls />
    <MiniMap />
  </VueFlow>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue"
import { VueFlow, useVueFlow } from "@vue-flow/core"
import { Background } from "@vue-flow/background"
import { Controls } from "@vue-flow/controls"
import { MiniMap } from "@vue-flow/minimap"
import { SmoothStepEdge } from "@vue-flow/core"
import CustomNode from "./CustomNode.vue"
import RectNode from "./RectNode.vue"
import CustomEdge from "./CustomEdge.vue"
import "@vue-flow/core/dist/style.css"
import "@vue-flow/core/dist/theme-default.css"
import "@vue-flow/controls/dist/style.css"
import "@vue-flow/minimap/dist/style.css"

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ nodes: [], edges: [] }),
  },
})

const emit = defineEmits([
  "update:modelValue",
  "elements-changed",
  "node-click",
  "edge-click",
])

// 基础状态
const elements = ref([])
const vueFlowInstance = ref(null)

// VueFlow API
const { setNodes, setEdges } = useVueFlow()

// 节点和边类型定义
const nodeTypes = {
  custom: CustomNode,
  rect: RectNode,
}

const edgeTypes = {
  smoothstep: SmoothStepEdge,
  bezier: CustomEdge,
}

// 计算属性
const nodes = computed(() =>
  elements.value.filter((el) => !el.source && !el.target)
)

const edges = computed(() =>
  elements.value.filter((el) => el.source && el.target)
)

// 监听props变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue.nodes && newValue.edges) {
      console.log('VueFlowCanvas 接收到新数据:', {
        nodes: newValue.nodes.map(n => ({ id: n.id, highlighted: n.data?.highlighted, subgraphHighlighted: n.data?.subgraphHighlighted })),
        edges: newValue.edges.length
      })
      
      // 直接使用新值，不保留旧的高亮状态，因为高亮状态应该由父组件管理
      const updatedNodes = newValue.nodes.map(node => ({ ...node }))
      const updatedEdges = newValue.edges.map(edge => ({ ...edge }))
      
      elements.value = [...updatedNodes, ...updatedEdges]
      
      nextTick(() => {
        try {
          setNodes(updatedNodes)
          setEdges(updatedEdges)
          console.log('VueFlow 更新完成')
        } catch (error) {
          console.error("更新VueFlow失败:", error)
        }
      })
    }
  },
  { immediate: true, deep: true }
)

// 监听elements变化 - 添加防抖避免循环更新
let updateTimeout = null
watch(
  elements,
  (newElements) => {
    if (updateTimeout) {
      clearTimeout(updateTimeout)
    }
    
    updateTimeout = setTimeout(() => {
      const nodes = newElements.filter((el) => !el.source && !el.target)
      const edges = newElements.filter((el) => el.source && el.target)
      const result = { nodes, edges }
      
      console.log('VueFlowCanvas emit elements-changed:', {
        nodes: nodes.map(n => ({ id: n.id, highlighted: n.data?.highlighted }))
      })
      
      emit("elements-changed", result)
      // 不emit update:modelValue，避免循环更新
    }, 50)
  },
  { deep: true }
)

// VueFlow 事件处理
const onNodeDragStop = (event, node) => {
  console.log("节点拖拽结束:", node)
}

const onNodeClick = (event, node) => {
  console.log("节点点击:", node)
  emit("node-click", { event, node })
}

const onEdgeClick = (event, edge) => {
  console.log("边点击:", edge)
  emit("edge-click", { event, edge })
}

const onConnect = (params) => {
  const newEdge = {
    id: `${params.source}-${params.target}`,
    source: params.source,
    target: params.target,
    label: "关系",
    type: "bezier",
  }
  elements.value.push(newEdge)
}

const onNodesDelete = (nodes) => {
  console.log("删除节点:", nodes)
}

const onEdgesDelete = (edges) => {
  console.log("删除边:", edges)
}

// 画布控制方法
const fitView = (options = {}) => {
  if (vueFlowInstance.value) {
    try {
      vueFlowInstance.value.fitView({
        padding: 0.1,
        duration: 800,
        maxZoom: 1.5,
        minZoom: 0.3,
        ...options,
      })
    } catch (error) {
      console.error("画布适应失败:", error)
    }
  }
}

// 暴露方法
defineExpose({
  getElements: () => elements.value,
  setElements: (newElements) => {
    elements.value = newElements
  },
  fitView: (options = {}) => {
    try {
      // 如果传入了特定节点，则聚焦到这些节点
      if (options.nodes && options.nodes.length > 0) {
        const nodeIds = options.nodes.map(node => node.id)
        fitView({ 
          nodes: nodeIds,
          duration: options.duration || 800, 
          padding: options.padding || 0.3 
        })
      } else {
        // 默认适应所有内容
        fitView({ duration: 800, padding: 0.1 })
      }
    } catch (error) {
      console.error("fitView失败:", error)
    }
  },
  vueFlowInstance,
})
</script>

<style scoped>
.vueflow-canvas {
  flex: 1;
  height: 100%;
}
</style>
