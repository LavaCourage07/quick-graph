<template>
  <div class="info-panel">
    <div class="panel-header">
      <h3>{{ panelTitle }}</h3>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>
    
    <div class="panel-content">
      <div v-if="panelType === 'nodes'" class="nodes-list">
        <div
          v-for="node in nodes"
          :key="node.id"
          class="node-item"
          :class="{ selected: selectedNode?.id === node.id }"
          @click="selectNode(node)"
        >
          <div class="node-label">{{ node.data?.label || node.id }}</div>
          <div class="node-type">{{ node.type || 'custom' }}</div>
          <div v-if="node.data?.description" class="node-description">
            {{ node.data.description }}
          </div>
          <button
            v-if="!node.data?.description"
            class="enhance-btn"
            @click.stop="enhanceNode(node)"
          >
            完善信息
          </button>
        </div>
      </div>
      
      <div v-else-if="panelType === 'edges'" class="edges-list">
        <div
          v-for="edge in edges"
          :key="edge.id"
          class="edge-item"
          :class="{ selected: selectedEdge?.id === edge.id }"
          @click="selectEdge(edge)"
        >
          <div class="edge-label">{{ edge.label || '关系' }}</div>
          <div class="edge-type">{{ edge.type || 'bezier' }}</div>
          <div class="edge-connection">
            {{ edge.source }} → {{ edge.target }}
          </div>
          <div v-if="edge.data?.description" class="edge-description">
            {{ edge.data.description }}
          </div>
          <button
            v-if="!edge.data?.description"
            class="enhance-btn"
            @click.stop="enhanceEdge(edge)"
          >
            完善信息
          </button>
        </div>
      </div>
      
      <div v-else class="no-data">
        暂无数据
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  panelType: {
    type: String,
    default: 'nodes'
  },
  nodes: {
    type: Array,
    default: () => []
  },
  edges: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'select-node',
  'select-edge',
  'enhance-node',
  'enhance-edge',
  'close'
])

const selectedNode = ref(null)
const selectedEdge = ref(null)

const panelTitle = computed(() => {
  switch (props.panelType) {
    case 'nodes':
      return `节点列表 (${props.nodes.length})`
    case 'edges':
      return `边列表 (${props.edges.length})`
    default:
      return '信息面板'
  }
})

const selectNode = (node) => {
  selectedNode.value = node
  emit('select-node', node)
}

const selectEdge = (edge) => {
  selectedEdge.value = edge
  emit('select-edge', edge)
}

const enhanceNode = (node) => {
  emit('enhance-node', node)
}

const enhanceEdge = (edge) => {
  emit('enhance-edge', edge)
}
</script>

<style scoped>
.info-panel {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 300px;
  max-height: 500px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #e9ecef;
  color: #333;
}

.panel-content {
  max-height: 400px;
  overflow-y: auto;
}

.nodes-list,
.edges-list {
  padding: 8px 0;
}

.node-item,
.edge-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.node-item:hover,
.edge-item:hover {
  background: #f8f9fa;
}

.node-item.selected,
.edge-item.selected {
  background: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.node-label,
.edge-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.node-type,
.edge-type {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.edge-connection {
  font-size: 12px;
  color: #888;
  font-family: monospace;
  margin-bottom: 4px;
}

.node-description,
.edge-description {
  font-size: 12px;
  color: #555;
  line-height: 1.4;
  margin-top: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.enhance-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 4px 8px;
  font-size: 11px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 8px;
}

.enhance-btn:hover {
  background: #0056b3;
}

.no-data {
  padding: 40px 20px;
  text-align: center;
  color: #666;
  font-style: italic;
}
</style>

