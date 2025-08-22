<!-- src/components/SmartSearch.vue -->
<template>
  <div class="smart-search-widget" :style="widgetStyle" ref="widgetRef">
    <div class="header" @mousedown="startDrag">
      <span>智能搜索</span>
      <button class="expand-btn" @click="toggleExpand">{{ isExpanded ? '收起' : '展开' }}</button>
    </div>
    <div v-if="isExpanded" class="content">
      <div class="search-bar">
        <input
          type="text"
          v-model="query"
          placeholder="例如：查找锅炉节点"
          @keyup.enter="handleSearch"
        />
        <button @click="handleSearch" :disabled="isLoading">搜索</button>
      </div>
      <div v-if="isLoading" class="loading">正在解析意图...</div>
      <div v-if="results.length > 0" class="results">
        <p>您可能想找：</p>
        <ul>
          <li v-for="node in results" :key="node.id" @click="selectAlternative(node)">
            {{ node.data.label || node.id }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

// Props & Emits
defineProps({
  isLoading: Boolean,
  results: { // 匹配到的多个备选节点
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['search', 'select-alternative']);

// State
const query = ref('');
const isExpanded = ref(true);
const widgetRef = ref(null);
const position = reactive({ x: 30, y: 30 }); // 初始位置
const dragInfo = reactive({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });

// Computed style for the widget's position
const widgetStyle = computed(() => ({
  top: `${position.y}px`,
  left: `${position.x}px`,
}));

// Methods
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const handleSearch = () => {
  if (query.value.trim()) {
    emit('search', query.value.trim());
  }
};

const selectAlternative = (node) => {
  emit('select-alternative', node);
};

// Drag and Drop Logic
const startDrag = (event) => {
  dragInfo.isDragging = true;
  dragInfo.startX = event.clientX;
  dragInfo.startY = event.clientY;
  dragInfo.initialX = position.x;
  dragInfo.initialY = position.y;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
};

const onDrag = (event) => {
  if (!dragInfo.isDragging) return;
  const dx = event.clientX - dragInfo.startX;
  const dy = event.clientY - dragInfo.startY;
  position.x = dragInfo.initialX + dx;
  position.y = dragInfo.initialY + dy;
};

const stopDrag = () => {
  dragInfo.isDragging = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

</script>

<style scoped>
.smart-search-widget {
  position: absolute;
  z-index: 1000;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 320px;
  font-family: sans-serif;
}

.header {
  background: #f0f0f0;
  padding: 8px 12px;
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  user-select: none;

  .expand-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #4068d4;
    padding: 0;
    margin: 0;
  }
}

.content {
  padding: 12px;
}

.search-bar {
  display: flex;
  gap: 8px;
}

.search-bar input {
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.search-bar button {
  padding: 8px 12px;
  border: none;
  background-color: #4068d4;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.search-bar button:disabled {
  background-color: #a0b3e0;
}

.loading,
.results {
  margin-top: 12px;
}

.results ul {
  list-style: none;
  padding: 0;
  margin-top: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.results li {
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
}

.results li:hover {
  background-color: #f0f0f0;
}
</style>
