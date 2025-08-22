<!-- src/components/SmartSearch.vue -->
<template>
  <div
    class="smart-search-widget"
    :class="{ 'is-expanded': isExpanded, 'is-dragging': dragInfo.isDragging }"
    :style="widgetStyle"
    ref="widgetRef"
    @mousedown="startDrag"
  >
    <!-- Collapsed State: Circular Button -->
    <div v-if="!isExpanded" class="collapsed-view" @click.stop="toggleExpand">
      <svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.75L13.0607 5.93934L13.5 7.3033L14.8641 7.74264L18.0534 8.8033L14.8641 9.86402L13.5 10.3033L13.0607 11.6673L12 14.8566L10.9393 11.6673L10.5 10.3033L9.1359 9.86402L5.94658 8.8033L9.1359 7.74264L10.5 7.3033L10.9393 5.93934L12 2.75Z" stroke="currentColor" stroke-width="1.5"/>
        <path d="M5 16L5.53033 17.0607L6 17.5L7.06066 18.0303L5.53033 18.5607L5 19L4.46967 18.5607L3 18.0303L4.06066 17.5L4.46967 17.0607L5 16Z" stroke="currentColor" stroke-width="1.5"/>
        <path d="M19 15L19.5303 16.0607L20 16.5L21.0607 17.0303L19.5303 17.5607L19 18L18.4697 17.5607L17 17.0303L18.0607 16.5L18.4697 16.0607L19 15Z" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    </div>

    <!-- Expanded State: Search Panel -->
    <div v-if="isExpanded" class="expanded-view">
      <div class="header">
        <span>智能搜索</span>
        <button class="close-btn" @click.stop="toggleExpand">×</button>
      </div>
      <div class="content">
        <div class="search-bar">
          <input
            type="text"
            v-model="query"
            placeholder="例如：查找锅炉节点"
            @keyup.enter="handleSearch"
            @mousedown.stop
          />
          <button @click.stop="handleSearch" :disabled="isLoading || !query.trim()">
            <span v-if="isLoading" class="spinner"></span>
            <span v-else>搜索</span>
          </button>
        </div>
        <div v-if="results.length > 0" class="results">
          <p>您可能想找：</p>
          <ul>
            <li v-for="node in results" :key="node.id" @click.stop="selectAlternative(node)">
              {{ node.data.label || node.id }}
            </li>
          </ul>
        </div>
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
const isExpanded = ref(false); // Default to collapsed
const widgetRef = ref(null);
const position = reactive({ x: 30, y: 30 }); // Base position
const dragOffset = reactive({ x: 0, y: 0 }); // Drag offset
const dragInfo = reactive({ isDragging: false, startX: 0, startY: 0 });

// Computed style for the widget's position
const widgetStyle = computed(() => ({
  top: `${position.y}px`,
  left: `${position.x}px`,
  transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
}));

// Methods
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const handleSearch = () => {
  if (query.value.trim() && !isLoading.value) {
    emit('search', query.value.trim());
  }
};

const selectAlternative = (node) => {
  emit('select-alternative', node);
};

// Drag and Drop Logic
const startDrag = (event) => {
  // Only allow dragging from the header of the expanded view or the collapsed button
  if (isExpanded.value && !event.target.closest('.header')) {
    return;
  }
  dragInfo.isDragging = true;
  dragInfo.startX = event.clientX;
  dragInfo.startY = event.clientY;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
};

const onDrag = (event) => {
  if (!dragInfo.isDragging) return;
  event.preventDefault();
  dragOffset.x = event.clientX - dragInfo.startX;
  dragOffset.y = event.clientY - dragInfo.startY;
};

const stopDrag = () => {
  if (dragInfo.isDragging) {
    // Apply the drag offset to the base position
    position.x += dragOffset.x;
    position.y += dragOffset.y;
    // Reset the offset
    dragOffset.x = 0;
    dragOffset.y = 0;
  }
  dragInfo.isDragging = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};
</script>

<style scoped>
.smart-search-widget {
  position: absolute;
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: move;
}

.smart-search-widget.is-dragging {
  transition: none;
}

/* Collapsed State */
.collapsed-view {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #4068d4;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}
.collapsed-view:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
}
.collapsed-view .icon {
  width: 28px;
  height: 28px;
}

/* Expanded State */
.smart-search-widget.is-expanded {
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  cursor: default;
}

.expanded-view {
  width: 100%;
}

.header {
  background: #f7f9fc;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-bottom: 1px solid #eef2f7;
  font-weight: 600;
  color: #333;
  cursor: move;
  user-select: none;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
.close-btn:hover {
  color: #333;
}

.content {
  padding: 16px;
}

.search-bar {
  display: flex;
  gap: 8px;
}

.search-bar input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-bar input:focus {
  outline: none;
  border-color: #4068d4;
  box-shadow: 0 0 0 3px rgba(64, 104, 212, 0.2);
}

.search-bar button {
  padding: 0 16px;
  border: none;
  background-color: #4068d4;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}
.search-bar button:hover:not(:disabled) {
  background-color: #3557c0;
}
.search-bar button:disabled {
  background-color: #a0b3e0;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results {
  margin-top: 16px;
  font-size: 14px;
}
.results p {
  margin: 0 0 8px 0;
  color: #666;
  font-weight: 500;
}

.results ul {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 160px;
  overflow-y: auto;
}

.results li {
  padding: 10px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.results li:hover {
  background-color: #f0f4ff;
}
</style>
