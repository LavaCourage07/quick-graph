<template>
  <div v-if="visible" class="dialog-overlay" @click="closeDialog">
    <div class="dialog-content" @click.stop>
      <div class="dialog-header">
        <h3>智能修改图纸</h3>
        <button class="close-btn" @click="closeDialog">×</button>
      </div>
      
      <div class="dialog-body">
        <div class="current-graph-info">
          <h4>当前图纸信息</h4>
          <p>节点数量: {{ nodes.length }}</p>
          <p>边数量: {{ edges.length }}</p>
          <div class="node-list">
            <span>节点: </span>
            <span v-for="(node, index) in nodes" :key="node.id" class="node-tag">
              {{ node.data?.label || '未命名' }}{{ index < nodes.length - 1 ? ', ' : '' }}
            </span>
          </div>
        </div>
        
        <div class="input-section">
          <label for="edit-instruction">请描述您想要的修改：</label>
          <textarea
            id="edit-instruction"
            v-model="instruction"
            placeholder="例如：在用户管理节点下新增两个子节点：用户注册和用户登录&#10;或者：删除订单管理节点&#10;或者：在用户管理和订单管理之间添加关联关系"
            rows="4"
            :disabled="isProcessing"
          ></textarea>
        </div>
        
        <div class="example-section">
          <h4>示例指令：</h4>
          <div class="examples">
            <button 
              class="example-btn" 
              @click="setExample('在用户管理节点下新增两个子节点：用户注册和用户登录')"
              :disabled="isProcessing"
            >
              新增节点
            </button>
            <button 
              class="example-btn" 
              @click="setExample('删除订单管理节点')"
              :disabled="isProcessing"
            >
              删除节点
            </button>
            <button 
              class="example-btn" 
              @click="setExample('在用户管理和订单管理之间添加关联关系')"
              :disabled="isProcessing"
            >
              添加关系
            </button>
          </div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="closeDialog" :disabled="isProcessing">
          取消
        </button>
        <button 
          class="btn btn-primary" 
          @click="processInstruction" 
          :disabled="!instruction.trim() || isProcessing"
        >
          <span v-if="isProcessing" class="spinner"></span>
          AI生成
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
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

const emit = defineEmits(['close', 'apply-changes'])

const instruction = ref('')
const isProcessing = ref(false)

const closeDialog = () => {
  if (!isProcessing.value) {
    instruction.value = ''
    emit('close')
  }
}

const setExample = (example) => {
  instruction.value = example
}

const processInstruction = async () => {
  if (!instruction.value.trim()) return
  
  isProcessing.value = true
  
  try {
    // 发送指令给父组件处理
    await emit('apply-changes', instruction.value.trim())
    closeDialog()
  } catch (error) {
    console.error('处理指令失败:', error)
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 8px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.dialog-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.current-graph-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.current-graph-info h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 14px;
}

.current-graph-info p {
  margin: 5px 0;
  font-size: 12px;
  color: #666;
}

.node-list {
  margin-top: 10px;
  font-size: 12px;
  color: #666;
}

.node-tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.input-section {
  margin-bottom: 20px;
}

.input-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.input-section textarea {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  box-sizing: border-box;
}

.input-section textarea:focus {
  outline: none;
  border-color: #4068d4;
  box-shadow: 0 0 0 2px rgba(64, 104, 212, 0.1);
}

.example-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
}

.examples {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.example-btn {
  background: #f0f8ff;
  border: 1px solid #4068d4;
  color: #4068d4;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.example-btn:hover:not(:disabled) {
  background: #4068d4;
  color: white;
}

.example-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialog-footer {
  padding: 20px;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background-color: #4068d4;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #3557c0;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>