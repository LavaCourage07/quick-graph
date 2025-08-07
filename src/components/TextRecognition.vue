<template>
  <div class="text-recognition">
    <div class="content-area">
      <div class="header-section">
        <h3>请输入业务描述文本</h3>
        <button class="sample-btn" @click="insertSample">
          <span>📝</span> 插入样例
        </button>
      </div>
      <textarea
        v-model="inputText"
        class="text-input"
        placeholder="请在此输入您的业务描述，例如：锅炉通过管道向换热器输送蒸汽，换热器将热量传递给冷却水，冷却水通过泵循环流动..."
        @input="handleTextChange"
      ></textarea>
      
      <!-- Mermaid预览区域 -->
      <div v-if="mermaidCode" class="mermaid-preview">
        <h4>解析结果预览</h4>
        <div class="mermaid-container">
          <pre class="mermaid-code">{{ mermaidCode }}</pre>
          <div class="mermaid-diagram" ref="mermaidDiagram"></div>
        </div>
      </div>
    </div>
    
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <span>正在智能分析文本...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import mermaid from 'mermaid'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  mermaidResult: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'text-changed'])

const inputText = ref(props.modelValue)
const isLoading = ref(false)
const mermaidCode = ref(props.mermaidResult)
const mermaidDiagram = ref(null)

// 初始化Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true
  }
})

const handleTextChange = () => {
  emit('update:modelValue', inputText.value)
  emit('text-changed', inputText.value)
}

// 插入样例文本
const insertSample = () => {
  const sampleText = `车间共有2台间歇式高温高压染缸：DK-101与DK-102。
每批次产能500kg坯布，工艺周期90min。
单批耗蒸汽1.2t（8bar饱和蒸汽，来自锅炉B-01），单批冷却水3.5m³（供水温度25°C，经冷却塔CT-01循环）。
染料溶液0.8m³/批，由Dye-Tank-01经计量泵P-DY-01输送。
蒸汽冷凝水通过Cond-Tank-01回收，回收率目标85%（低于80%需报警）。`
  
  inputText.value = sampleText
  handleTextChange()
}

// 渲染Mermaid图表
const renderMermaidDiagram = async () => {
  if (!mermaidCode.value || !mermaidDiagram.value) return
  
  try {
    // 清空之前的内容
    mermaidDiagram.value.innerHTML = ''
    
    // 提取mermaid代码块
    const mermaidMatch = mermaidCode.value.match(/```mermaid\n([\s\S]*?)\n```/)
    if (!mermaidMatch) {
      mermaidDiagram.value.innerHTML = '<div style="color: #999; font-style: italic;">无效的Mermaid代码格式</div>'
      return
    }
    
    const mermaidContent = mermaidMatch[1]
    
    // 生成唯一ID
    const id = `mermaid-${Date.now()}`
    
    // 渲染图表
    const { svg } = await mermaid.render(id, mermaidContent)
    mermaidDiagram.value.innerHTML = svg
  } catch (error) {
    console.error('Mermaid渲染失败:', error)
    mermaidDiagram.value.innerHTML = '<div style="color: #e74c3c; font-style: italic;">图表渲染失败</div>'
  }
}

watch(() => props.modelValue, (newValue) => {
  inputText.value = newValue
})

watch(() => props.mermaidResult, async (newValue) => {
  mermaidCode.value = newValue
  if (newValue) {
    await nextTick()
    renderMermaidDiagram()
  }
})

// 暴露方法给父组件
defineExpose({
  setLoading: (loading) => {
    isLoading.value = loading
  },
  setMermaidCode: (code) => {
    mermaidCode.value = code
    nextTick(() => {
      renderMermaidDiagram()
    })
  }
})
</script>

<style scoped>
.text-recognition {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-area {
  flex: 1;
  padding: 20px;
}

.content-area h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 18px;
}

.text-input {
  width: 100%;
  min-height: 300px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
}

.text-input:focus {
  outline: none;
  border-color: #4068D4;
  box-shadow: 0 0 0 2px rgba(64, 104, 212, 0.1);
}

.mermaid-preview {
  margin-top: 20px;
  border-top: 1px solid #e9ecef;
  padding-top: 20px;
}

.mermaid-preview h4 {
  margin-bottom: 15px;
  color: #333;
  font-size: 16px;
}

.mermaid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  min-height: 200px;
}

.mermaid-code {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 15px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  color: #333;
}

.mermaid-diagram {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 15px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  font-size: 12px;
  color: #666;
}

.mermaid-diagram:empty::before {
  content: "Mermaid图表将在这里显示";
  color: #999;
  font-style: italic;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.sample-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.sample-btn:hover {
  background: #e9ecef;
  border-color: #4068D4;
  color: #4068D4;
}

.sample-btn span {
  font-size: 16px;
}

.loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #4068D4;
  z-index: 10;
}
</style> 