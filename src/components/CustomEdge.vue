<template>
  <g>
    <!-- 边的路径 -->
    <BezierEdge
      :id="id"
      :source="source"
      :target="target"
      :source-x="sourceX"
      :source-y="sourceY"
      :target-x="targetX"
      :target-y="targetY"
      :source-position="sourcePosition"
      :target-position="targetPosition"
      :marker-end="markerEnd"
      :style="computedEdgeStyle"
    />
    
    <!-- 边的标签 -->
    <foreignObject
      :x="labelX - 40"
      :y="labelY - 10"
      width="80"
      height="20"
      @dblclick="startEditing"
    >
      <div
        v-if="!isEditing"
        class="edge-label"
        xmlns="http://www.w3.org/1999/xhtml"
      >
        {{ label || '关系' }}
      </div>
      
      <input
        v-if="isEditing"
        ref="editInput"
        v-model="editValue"
        class="edge-edit-input"
        @blur="finishEditing"
        @keyup.enter="finishEditing"
        @keyup.escape="cancelEditing"
        xmlns="http://www.w3.org/1999/xhtml"
      />
    </foreignObject>
  </g>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { BezierEdge } from '@vue-flow/core'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps({
  id: String,
  source: String,
  target: String,
  sourceX: Number,
  sourceY: Number,
  targetX: Number,
  targetY: Number,
  sourcePosition: String,
  targetPosition: String,
  label: String,
  style: Object,
  markerEnd: String,
  subgraphHighlighted: Boolean,
  dimmed: Boolean,
})

const { findEdge, updateEdge } = useVueFlow()

const isEditing = ref(false)
const editValue = ref('')
const editInput = ref(null)

// 计算标签位置（边的中点）
const labelX = computed(() => (props.sourceX + props.targetX) / 2)
const labelY = computed(() => (props.sourceY + props.targetY) / 2)

const startEditing = (event) => {
  event.stopPropagation()
  isEditing.value = true
  editValue.value = props.label || '关系'
  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus()
      editInput.value.select()
    }
  })
}

const finishEditing = () => {
  if (editValue.value.trim()) {
    const edge = findEdge(props.id)
    if (edge) {
      edge.label = editValue.value.trim()
    }
  }
  isEditing.value = false
}

const cancelEditing = () => {
  isEditing.value = false
  editValue.value = props.label || '关系'
}

// 计算边的动态样式
const computedEdgeStyle = computed(() => {
  const baseStyle = props.style || {}
  
  // 尝试从VueFlow获取边数据
  const edge = findEdge(props.id)
  
  // 调试信息
  console.log(`Edge ${props.id} - edge data:`, edge)
  console.log(`Edge ${props.id} - subgraphHighlighted: ${edge?.subgraphHighlighted || edge?.data?.subgraphHighlighted}, dimmed: ${edge?.dimmed || edge?.data?.dimmed}`)
  
  // 检查多个可能的高亮状态位置
  const isSubgraphHighlighted = edge?.subgraphHighlighted || edge?.data?.subgraphHighlighted || props.subgraphHighlighted
  const isDimmed = edge?.dimmed || edge?.data?.dimmed || props.dimmed
  const isNewlyAdded = edge?.data?.isNewlyAdded
  const isModified = edge?.data?.isModified && !edge?.data?.isNewlyAdded
  
  if (isNewlyAdded) {
    // 新增关系样式 - 深蓝色虚线，更明显的效果
    console.log(`Edge ${props.id} applying newly-added style`)
    return {
      ...baseStyle,
      stroke: '#0056b3',
      strokeWidth: 5,
      strokeDasharray: '12 6',
      opacity: 1,
      filter: 'drop-shadow(0 0 10px rgba(0, 86, 179, 0.8))'
    }
  } else if (isModified) {
    // 修改关系样式 - 淡蓝色实线
    console.log(`Edge ${props.id} applying modified style`)
    return {
      ...baseStyle,
      stroke: '#64b5f6',
      strokeWidth: 3,
      strokeDasharray: 'none',
      opacity: 1,
      filter: 'drop-shadow(0 0 6px rgba(100, 181, 246, 0.6))'
    }
  } else if (isSubgraphHighlighted) {
    // 子图高亮样式 - 更明显的绿色高亮效果
    console.log(`Edge ${props.id} applying subgraph highlight style`)
    return {
      ...baseStyle,
      stroke: '#28a745',
      strokeWidth: 4,
      strokeDasharray: 'none',
      opacity: 1,
      filter: 'drop-shadow(0 0 6px rgba(40, 167, 69, 0.6))'
    }
  } else if (isDimmed) {
    // 淡化样式
    console.log(`Edge ${props.id} applying dimmed style`)
    return {
      ...baseStyle,
      opacity: 0.3,
      stroke: '#999',
      strokeWidth: 1
    }
  }
  
  // 默认样式
  console.log(`Edge ${props.id} using default style`)
  return baseStyle
})
</script>

<style scoped>
.edge-label {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 10px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.edge-label:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #4068D4;
}

.edge-edit-input {
  width: 70px;
  height: 16px;
  border: 1px solid #4068D4;
  border-radius: 4px;
  padding: 1px 4px;
  font-size: 10px;
  text-align: center;
  background: white;
  outline: none;
}
</style>