<template>
  <div class="canvas-header">
    <div class="header-left">
      <h3>正式图纸</h3>
    </div>

    <div class="header-center">
      <div class="search-container">
        <!-- 节点搜索框 -->
        <div class="search-section">
          <input
            :value="searchQuery"
            @input="handleSearchInput"
            placeholder="搜索节点"
            class="search-input"
          />
          <div v-if="searchResults.length > 0" class="search-dropdown">
            <div
              v-for="node in searchResults"
              :key="node.id"
              class="dropdown-item"
              @click="$emit('select-node', node.id)"
            >
              {{ node.data.label }}
            </div>
          </div>
          <div
            v-else-if="searchQuery.trim() && searchResults.length === 0"
            class="no-results"
          >
            未找到匹配节点
          </div>
        </div>

        <!-- 子图搜索框 -->
        <div class="search-section">
          <input
            :value="subgraphQuery"
            @input="handleSubgraphInput"
            @keyup.enter="$emit('subgraph-search')"
            placeholder="搜索节点创建子图"
            class="search-input"
          />
          <div v-if="subgraphResults.length > 0" class="search-dropdown">
            <div
              v-for="node in subgraphResults"
              :key="node.id"
              class="dropdown-item"
              @click="$emit('select-subgraph-node', node.id)"
            >
              {{ node.data.label }}
            </div>
          </div>
          <div
            v-else-if="subgraphQuery.trim() && subgraphResults.length === 0"
            class="no-results"
          >
            未找到匹配节点
          </div>
        </div>

        <!-- 清除按钮 -->
        <button @click="$emit('clear-all')" class="clear-all-btn">清除</button>
      </div>
    </div>

    <div class="header-right">
      <div class="action-buttons">
        <!-- 聚焦编辑按钮 -->
        <div
          v-if="subgraphActive"
          class="focus-edit-container"
          @mouseenter="showTooltip = true"
          @mouseleave="showTooltip = false"
        >
          <button @click="$emit('focus-edit')" class="focus-edit-btn">
            聚焦编辑
          </button>
          <!-- 子图信息提示 -->
          <div v-if="showTooltip" class="subgraph-tooltip">
            <div class="tooltip-content">
              <div class="tooltip-title">子图信息</div>
              <div class="tooltip-stats">
                <span>节点: {{ subgraphStats.nodeCount }}个</span>
                <span>关系: {{ subgraphStats.edgeCount }}条</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 回到整体概览按钮 -->
        <button @click="$emit('overview')" class="overview-btn">
          回到整体概览
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  searchQuery: String,
  subgraphQuery: String,
  searchResults: Array,
  subgraphResults: Array,
  subgraphActive: Boolean,
  subgraphStats: Object,
});

const showTooltip = ref(false);

const emit = defineEmits([
  "update:searchQuery",
  "update:subgraphQuery",
  "search",
  "subgraph-search",
  "select-node",
  "select-subgraph-node",
  "clear-all",
  "focus-edit",
  "overview",
]);

const handleSearchInput = (event) => {
  const value = event.target.value;
  emit("update:searchQuery", value);
  emit("search");
};

const handleSubgraphInput = (event) => {
  const value = event.target.value;
  emit("update:subgraphQuery", value);
  emit("subgraph-search");
};
</script>

<style scoped>
.canvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  position: relative;
  z-index: 1000;
  flex-shrink: 0;
  min-height: 60px;
}

.header-left h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 600px;
  margin: 0 20px;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 500px;
}

.search-section {
  position: relative;
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #4068d4;
  box-shadow: 0 0 0 2px rgba(64, 104, 212, 0.1);
}

.search-indicator {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #e8f4fd;
  color: #4068d4;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 0 0 4px 4px;
  border: 1px solid #4068d4;
  border-top: none;
  z-index: 1001;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.no-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff3cd;
  color: #856404;
  padding: 8px 12px;
  font-size: 12px;
  border: 1px solid #ffeaa7;
  border-top: none;
  border-radius: 0 0 6px 6px;
  z-index: 1001;
}

.clear-all-btn {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.clear-all-btn:hover {
  background: #5a6268;
}

.header-right {
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.focus-edit-container {
  position: relative;
}

.focus-edit-btn,
.overview-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.focus-edit-btn {
  background: #4068d4;
  color: white;
}

.focus-edit-btn:hover {
  background: #3557c0;
  transform: translateY(-1px);
}

.overview-btn {
  background: #6c757d;
  color: white;
}

.overview-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.subgraph-tooltip {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.tooltip-content {
  background: #333;
  color: white;
  padding: 12px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  font-size: 12px;
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 6px;
  color: #fff;
}

.tooltip-stats {
  display: flex;
  gap: 12px;
}

.tooltip-stats span {
  color: #ccc;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .canvas-header {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    min-height: auto;
  }

  .header-center {
    margin: 0;
    max-width: 100%;
  }

  .search-container {
    flex-direction: column;
    gap: 8px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .focus-edit-btn,
  .overview-btn,
  .clear-all-btn {
    width: 100%;
  }
}
</style>
