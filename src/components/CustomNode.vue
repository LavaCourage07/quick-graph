<template>
  <div class="custom-node" :class="{ 
    highlighted: data.highlighted === true,
    'subgraph-highlighted': data.subgraphHighlighted === true,
    dimmed: data.dimmed === true
  }">
    <!-- 四个连接桩 -->
    <Handle type="source" position="top" id="top" class="custom-handle" />
    <Handle
      type="target"
      position="top"
      id="top-target"
      class="custom-handle"
    />

    <Handle type="source" position="right" id="right" class="custom-handle" />
    <Handle
      type="target"
      position="right"
      id="right-target"
      class="custom-handle"
    />

    <Handle type="source" position="bottom" id="bottom" class="custom-handle" />
    <Handle
      type="target"
      position="bottom"
      id="bottom-target"
      class="custom-handle"
    />

    <Handle type="source" position="left" id="left" class="custom-handle" />
    <Handle
      type="target"
      position="left"
      id="left-target"
      class="custom-handle"
    />

    <!-- 节点内容 -->
    <div class="node-content" @dblclick="startEditing" v-if="!isEditing">
      {{ data.label }}{{ data.highlighted ? " *" : "" }}
    </div>

    <!-- 编辑输入框 -->
    <input
      v-if="isEditing"
      ref="editInput"
      v-model="editValue"
      class="node-edit-input"
      @blur="finishEditing"
      @keyup.enter="finishEditing"
      @keyup.escape="cancelEditing"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, watch, computed } from "vue";
import { Handle } from "@vue-flow/core";
import { useVueFlow } from "@vue-flow/core";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
});

const { updateNodeData } = useVueFlow();

const isEditing = ref(false);
const editValue = ref("");
const editInput = ref(null);

// 监听高亮属性变化
watch(
  () => props.data.highlighted,
  (newVal) => {
    console.log(
      `CustomNode: 节点 ${props.data.label} (${props.id}) 高亮状态变化:`,
      newVal
    );
  },
  { immediate: true }
);

// 监听子图高亮属性变化
watch(
  () => props.data.subgraphHighlighted,
  (newVal) => {
    console.log(
      `CustomNode: 节点 ${props.data.label} (${props.id}) 子图高亮状态变化:`,
      newVal
    );
  },
  { immediate: true }
);

// 监听淡化属性变化
watch(
  () => props.data.dimmed,
  (newVal) => {
    console.log(
      `CustomNode: 节点 ${props.data.label} (${props.id}) 淡化状态变化:`,
      newVal
    );
  },
  { immediate: true }
);

const startEditing = () => {
  isEditing.value = true;
  editValue.value = props.data.label;
  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus();
      editInput.value.select();
    }
  });
};

const finishEditing = () => {
  if (editValue.value.trim()) {
    updateNodeData(props.id, { label: editValue.value.trim() });
  }
  isEditing.value = false;
};

const cancelEditing = () => {
  isEditing.value = false;
  editValue.value = props.data.label;
};
</script>

<style scoped>
.custom-node {
  background: #f0f8ff;
  border: 2px solid #4068d4;
  border-radius: 50%;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  text-align: center;
  padding: 8px;
  box-sizing: border-box;
  word-wrap: break-word;
  line-height: 1.2;
  position: relative;
}

.node-content {
  z-index: 1;
  pointer-events: auto;
  cursor: pointer;
}

.node-edit-input {
  width: 80px;
  height: 20px;
  border: 1px solid #4068d4;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 11px;
  text-align: center;
  background: white;
  z-index: 2;
  outline: none;
}

.custom-handle {
  width: 8px;
  height: 8px;
  background: #ffffff;
  border: 2px solid #4068d4;
  border-radius: 50%;
  opacity: 1;
}

/* 隐藏target handles，只显示source handles */
.custom-handle[data-handleid$="-target"] {
  opacity: 0;
  pointer-events: all;
}

/* 连接桩位置 */
.custom-handle[data-handlepos="top"] {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
}

.custom-handle[data-handlepos="right"] {
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
}

.custom-handle[data-handlepos="bottom"] {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
}

.custom-handle[data-handlepos="left"] {
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
}

/* 鼠标悬停效果 */
.custom-handle:hover {
  background: #4068d4;
  transform: scale(1.2);
}

.custom-handle[data-handlepos="top"]:hover {
  transform: translateX(-50%) scale(1.2);
}

.custom-handle[data-handlepos="right"]:hover {
  transform: translateY(-50%) scale(1.2);
}

.custom-handle[data-handlepos="bottom"]:hover {
  transform: translateX(-50%) scale(1.2);
}

.custom-handle[data-handlepos="left"]:hover {
  transform: translateY(-50%) scale(1.2);
}

/* 高亮效果 */
.custom-node.highlighted {
  animation: blue-highlight-pulse 2s ease-in-out infinite;
  border-color: #4068d4;
  box-shadow: 0 0 25px rgba(64, 104, 212, 0.6);
  background: linear-gradient(135deg, #f0f8ff 0%, #e8f4fd 100%);
}

/* 子图高亮效果 */
.custom-node.subgraph-highlighted {
  animation: subgraph-highlight-pulse 2s ease-in-out infinite;
  border-color: #28a745;
  box-shadow: 0 0 30px rgba(40, 167, 69, 0.7);
  background: linear-gradient(135deg, #f8fff9 0%, #e8f5e8 100%);
  z-index: 10;
}

/* 淡化效果 */
.custom-node.dimmed {
  opacity: 0.3;
  filter: grayscale(0.5);
  transition: all 0.3s ease;
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

@keyframes subgraph-highlight-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 30px rgba(40, 167, 69, 0.7);
    border-color: #28a745;
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 40px rgba(40, 167, 69, 0.9);
    border-color: #1e7e34;
  }
}
</style>
