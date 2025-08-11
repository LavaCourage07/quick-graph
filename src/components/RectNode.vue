<template>
  <div 
    class="rect-node"
    :class="{ 
      'highlighted': data.highlighted === true,
      'subgraph-highlighted': data.subgraphHighlighted === true,
      'dimmed': data.dimmed === true
    }"
  >
    <!-- 四个连接桩 -->
    <Handle
      type="source"
      position="top"
      id="top"
      class="rect-handle"
    />
    <Handle
      type="target"
      position="top"
      id="top-target"
      class="rect-handle"
    />
    
    <Handle
      type="source"
      position="right"
      id="right"
      class="rect-handle"
    />
    <Handle
      type="target"
      position="right"
      id="right-target"
      class="rect-handle"
    />
    
    <Handle
      type="source"
      position="bottom"
      id="bottom"
      class="rect-handle"
    />
    <Handle
      type="target"
      position="bottom"
      id="bottom-target"
      class="rect-handle"
    />
    
    <Handle
      type="source"
      position="left"
      id="left"
      class="rect-handle"
    />
    <Handle
      type="target"
      position="left"
      id="left-target"
      class="rect-handle"
    />
    
    <!-- 节点内容 -->
    <div class="node-header">
      <div class="node-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="2" fill="#4068D4"/>
          <rect x="4" y="4" width="8" height="8" rx="1" fill="white"/>
        </svg>
      </div>
      <div class="node-title">{{ data.label }}{{ data.highlighted ? ' *' : '' }}</div>
    </div>
  </div>
</template>

<script setup>
import { Handle } from '@vue-flow/core'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

// 移除了状态显示相关的函数
</script>

<style scoped>
.rect-node {
  background: #ffffff;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  min-width: 200px;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.node-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 8px;
}

.node-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-title {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 移除了状态标签相关的样式 */

.rect-handle {
  width: 8px;
  height: 8px;
  background: #ffffff;
  border: 2px solid #4068D4;
  border-radius: 50%;
  opacity: 1;
}

/* 隐藏target handles，只显示source handles */
.rect-handle[data-handleid$="-target"] {
  opacity: 0;
  pointer-events: all;
}

/* 连接桩位置 */
.rect-handle[data-handlepos="top"] {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
}

.rect-handle[data-handlepos="right"] {
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
}

.rect-handle[data-handlepos="bottom"] {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
}

.rect-handle[data-handlepos="left"] {
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
}

/* 鼠标悬停效果 */
.rect-handle:hover {
  background: #4068D4;
  transform: scale(1.2);
}

.rect-handle[data-handlepos="top"]:hover {
  transform: translateX(-50%) scale(1.2);
}

.rect-handle[data-handlepos="right"]:hover {
  transform: translateY(-50%) scale(1.2);
}

.rect-handle[data-handlepos="bottom"]:hover {
  transform: translateX(-50%) scale(1.2);
}

.rect-handle[data-handlepos="left"]:hover {
  transform: translateY(-50%) scale(1.2);
}

/* 节点悬停效果 */
.rect-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #4068D4;
}

/* 高亮效果 */
.rect-node.highlighted {
  animation: blue-highlight-pulse 2s ease-in-out infinite;
  border-color: #4068d4 !important;
  box-shadow: 0 0 25px rgba(64, 104, 212, 0.6) !important;
  background: linear-gradient(135deg, #f0f8ff 0%, #e8f4fd 100%) !important;
}

/* 子图高亮效果 */
.rect-node.subgraph-highlighted {
  animation: subgraph-highlight-pulse 2s ease-in-out infinite;
  border-color: #28a745 !important;
  box-shadow: 0 0 30px rgba(40, 167, 69, 0.7) !important;
  background: linear-gradient(135deg, #f8fff9 0%, #e8f5e8 100%) !important;
  z-index: 10;
}

/* 淡化效果 */
.rect-node.dimmed {
  opacity: 0.3;
  filter: grayscale(0.5);
  transition: all 0.3s ease;
}

@keyframes blue-highlight-pulse {
  0%, 100% {
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
  0%, 100% {
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