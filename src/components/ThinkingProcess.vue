<template>
  <div class="thinking-process" :class="{ active: isActive }">
    <!-- 思考过程头部 -->
    <!-- <div class="thinking-header"> -->
      <!-- <div class="thinking-title">
        <div class="brain-icon">🧠</div>
        <h4>AI深度思考中...</h4>
      </div> -->
      <div class="thinking-progress">
        <div class="progress-circle">
          <svg class="progress-ring" width="40" height="40">
            <circle
              class="progress-ring-circle"
              stroke="#4068d4"
              stroke-width="3"
              fill="transparent"
              r="16"
              cx="20"
              cy="20"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="strokeDashoffset"
            />
          </svg>
          <span class="progress-text">{{ Math.round(progress) }}%</span>
        </div>
      </div>
    <!-- </div> -->

    <!-- 思考步骤列表 -->
    <div class="thinking-steps">
      <div 
        v-for="(step, index) in thinkingSteps" 
        :key="step.id"
        class="thinking-step"
        :class="{ 
          active: step.status === 'active',
          completed: step.status === 'completed',
          pending: step.status === 'pending'
        }"
      >
        <div class="step-indicator">
          <div class="step-number" v-if="step.status === 'pending'">{{ index + 1 }}</div>
          <div class="step-spinner" v-else-if="step.status === 'active'">
            <div class="spinner-dot"></div>
          </div>
          <div class="step-check" v-else-if="step.status === 'completed'">✓</div>
        </div>
        
        <div class="step-content">
          <div class="step-title">{{ step.title }}</div>
          <div class="step-description" v-if="step.description">{{ step.description }}</div>
          
          <!-- 步骤详细信息 -->
          <div v-if="step.details && step.status === 'completed'" class="step-details">
            <div v-for="detail in step.details" :key="detail.key" class="detail-item">
              <span class="detail-label">{{ detail.label }}:</span>
              <span class="detail-value">{{ detail.value }}</span>
            </div>
          </div>
          
          <!-- 思考动画 -->
          <div v-if="step.status === 'active'" class="thinking-animation">
            <div class="thinking-dots">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 思考结果预览 -->
    <div v-if="showResults && results" class="thinking-results">
      <div class="results-header">
        <h5>初步分析结果</h5>
      </div>
      <div class="results-content">
        <div class="result-summary">{{ results.summary }}</div>
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-label">发现问题:</span>
            <span class="stat-value">{{ results.issuesCount }}个</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">优化建议:</span>
            <span class="stat-value">{{ results.suggestionsCount }}个</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  subgraphData: {
    type: Object,
    default: () => ({ nodes: [], edges: [] })
  },
  analysisType: {
    type: String,
    default: 'overall' // 'overall' | 'entity' | 'relation'
  }
})

const emit = defineEmits(['thinking-complete', 'step-complete'])

// 状态管理
const progress = ref(0)
const currentStepIndex = ref(-1)
const showResults = ref(false)
const results = ref(null)
const thinkingTimer = ref(null)

// 计算属性
const circumference = computed(() => 2 * Math.PI * 16)
const strokeDashoffset = computed(() => {
  return circumference.value - (progress.value / 100) * circumference.value
})

// 思考步骤定义
const thinkingSteps = ref([
  {
    id: 'analyze-structure',
    title: '分析图结构',
    description: '正在分析节点和边的拓扑结构...',
    status: 'pending',
    duration: 2000,
    details: null
  },
  {
    id: 'evaluate-completeness',
    title: '评估信息完整性',
    description: '检查节点和关系的信息完整程度...',
    status: 'pending',
    duration: 1800,
    details: null
  },
  {
    id: 'identify-patterns',
    title: '识别模式和规律',
    description: '寻找图中的模式、聚类和异常...',
    status: 'pending',
    duration: 2200,
    details: null
  },
  {
    id: 'assess-relationships',
    title: '评估关系合理性',
    description: '分析节点间关系的逻辑性和准确性...',
    status: 'pending',
    duration: 1600,
    details: null
  },
  {
    id: 'generate-insights',
    title: '生成洞察和建议',
    description: '基于分析结果生成优化建议...',
    status: 'pending',
    duration: 2400,
    details: null
  },
  {
    id: 'synthesize-results',
    title: '综合分析结果',
    description: '整合所有分析结果，形成最终报告...',
    status: 'pending',
    duration: 1500,
    details: null
  }
])

// 方法
const startThinking = async () => {
  console.log('开始思考过程')
  progress.value = 0
  currentStepIndex.value = -1
  showResults.value = false
  results.value = null
  
  // 重置所有步骤状态
  thinkingSteps.value.forEach(step => {
    step.status = 'pending'
    step.details = null
  })
  
  // 逐步执行思考过程
  for (let i = 0; i < thinkingSteps.value.length; i++) {
    await executeStep(i)
  }
  
  // 显示结果
  showResults.value = true
  results.value = generateResults()
  
  emit('thinking-complete', {
    results: results.value,
    steps: thinkingSteps.value
  })
}

const executeStep = async (stepIndex) => {
  const step = thinkingSteps.value[stepIndex]
  currentStepIndex.value = stepIndex
  
  // 设置步骤为活动状态
  step.status = 'active'
  
  // 模拟思考过程
  await new Promise(resolve => {
    const startTime = Date.now()
    const duration = step.duration
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const stepProgress = Math.min(elapsed / duration, 1)
      
      // 更新整体进度
      const baseProgress = (stepIndex / thinkingSteps.value.length) * 100
      const stepContribution = (stepProgress / thinkingSteps.value.length) * 100
      progress.value = baseProgress + stepContribution
      
      if (stepProgress < 1) {
        requestAnimationFrame(updateProgress)
      } else {
        resolve()
      }
    }
    
    updateProgress()
  })
  
  // 设置步骤为完成状态
  step.status = 'completed'
  step.details = generateStepDetails(step.id)
  
  emit('step-complete', {
    step: step,
    stepIndex: stepIndex
  })
}

const generateStepDetails = (stepId) => {
  const nodes = props.subgraphData.nodes || []
  const edges = props.subgraphData.edges || []
  
  switch (stepId) {
    case 'analyze-structure':
      return [
        { key: 'nodes', label: '节点数量', value: nodes.length },
        { key: 'edges', label: '边数量', value: edges.length },
        { key: 'density', label: '图密度', value: calculateDensity(nodes, edges) }
      ]
    case 'evaluate-completeness':
      return [
        { key: 'complete-nodes', label: '信息完整节点', value: `${getCompleteNodesCount(nodes)}/${nodes.length}` },
        { key: 'complete-edges', label: '信息完整边', value: `${getCompleteEdgesCount(edges)}/${edges.length}` }
      ]
    case 'identify-patterns':
      return [
        { key: 'clusters', label: '发现聚类', value: Math.floor(Math.random() * 3) + 1 },
        { key: 'anomalies', label: '异常节点', value: Math.floor(Math.random() * 2) }
      ]
    case 'assess-relationships':
      return [
        { key: 'logical', label: '逻辑合理关系', value: `${Math.floor(edges.length * 0.8)}/${edges.length}` },
        { key: 'missing', label: '可能缺失关系', value: Math.floor(Math.random() * 3) }
      ]
    case 'generate-insights':
      return [
        { key: 'issues', label: '发现问题', value: Math.floor(Math.random() * 5) + 2 },
        { key: 'suggestions', label: '优化建议', value: Math.floor(Math.random() * 4) + 3 }
      ]
    case 'synthesize-results':
      return [
        { key: 'score', label: '综合评分', value: `${Math.floor(Math.random() * 20) + 75}/100` },
        { key: 'priority', label: '优先级建议', value: Math.floor(Math.random() * 3) + 2 }
      ]
    default:
      return []
  }
}

const generateResults = () => {
  const nodes = props.subgraphData.nodes || []
  const edges = props.subgraphData.edges || []
  
  return {
    summary: `分析完成！该子图包含${nodes.length}个节点和${edges.length}个关系，整体结构合理，发现了一些优化机会。`,
    issuesCount: Math.floor(Math.random() * 5) + 2,
    suggestionsCount: Math.floor(Math.random() * 4) + 3,
    overallScore: Math.floor(Math.random() * 20) + 75
  }
}

// 辅助函数
const calculateDensity = (nodes, edges) => {
  if (nodes.length <= 1) return '0%'
  const maxEdges = nodes.length * (nodes.length - 1) / 2
  const density = (edges.length / maxEdges) * 100
  return `${Math.round(density)}%`
}

const getCompleteNodesCount = (nodes) => {
  return nodes.filter(node => {
    return node.data?.description || node.data?.englishName || 
           (node.data?.parameters && node.data.parameters.length > 0)
  }).length
}

const getCompleteEdgesCount = (edges) => {
  return edges.filter(edge => {
    return edge.data?.description || edge.data?.englishName
  }).length
}

const stopThinking = () => {
  if (thinkingTimer.value) {
    clearTimeout(thinkingTimer.value)
    thinkingTimer.value = null
  }
  
  // 重置状态
  progress.value = 0
  currentStepIndex.value = -1
  showResults.value = false
  thinkingSteps.value.forEach(step => {
    step.status = 'pending'
    step.details = null
  })
}

// 监听器
watch(() => props.isActive, (newValue) => {
  if (newValue) {
    startThinking()
  } else {
    stopThinking()
  }
})

// 生命周期
onMounted(() => {
  if (props.isActive) {
    startThinking()
  }
})

onUnmounted(() => {
  stopThinking()
})

// 暴露方法
defineExpose({
  startThinking,
  stopThinking,
  getResults: () => results.value
})
</script>

<style scoped>
.thinking-process {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.thinking-process.active {
  background: linear-gradient(135deg, #f8f9fa 0%, #e8f4fd 100%);
  border-color: #4068d4;
  box-shadow: 0 8px 32px rgba(64, 104, 212, 0.1);
}

.thinking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;
}

.thinking-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brain-icon {
  font-size: 24px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.thinking-title h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.thinking-progress {
  position: relative;
}

.progress-circle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-circle {
  transition: stroke-dashoffset 0.3s ease;
}

.progress-text {
  position: absolute;
  font-size: 12px;
  font-weight: 600;
  color: #4068d4;
}

.thinking-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.thinking-step {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.thinking-step.pending {
  opacity: 0.6;
}

.thinking-step.active {
  border-color: #4068d4;
  background: rgba(64, 104, 212, 0.02);
  transform: translateX(4px);
}

.thinking-step.completed {
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.02);
}

.step-indicator {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.thinking-step.pending .step-indicator {
  background: #e9ecef;
  color: #6c757d;
}

.thinking-step.active .step-indicator {
  background: #4068d4;
  color: white;
}

.thinking-step.completed .step-indicator {
  background: #28a745;
  color: white;
}

.step-number {
  font-size: 14px;
  font-weight: 600;
}

.step-spinner {
  width: 16px;
  height: 16px;
  position: relative;
}

.spinner-dot {
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

.step-check {
  font-size: 16px;
  font-weight: bold;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.step-description {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.4;
  margin-bottom: 8px;
}

.step-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.detail-item {
  background: rgba(64, 104, 212, 0.05);
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.detail-label {
  color: #6c757d;
  font-weight: 500;
}

.detail-value {
  color: #4068d4;
  font-weight: 600;
  margin-left: 4px;
}

.thinking-animation {
  margin-top: 12px;
}

.thinking-dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 6px;
  height: 6px;
  background: #4068d4;
  border-radius: 50%;
  animation: thinking 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes thinking {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.thinking-results {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.results-header h5 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.results-content {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.result-summary {
  font-size: 14px;
  color: #495057;
  line-height: 1.5;
  margin-bottom: 16px;
}

.result-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 13px;
  color: #6c757d;
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: #28a745;
  font-weight: 600;
  background: rgba(40, 167, 69, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .thinking-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .step-details {
    flex-direction: column;
    gap: 8px;
  }
  
  .result-stats {
    flex-direction: column;
    gap: 12px;
  }
}

/* 动画增强 */
.thinking-step {
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.thinking-process.active .brain-icon {
  animation: pulse 2s ease-in-out infinite, rotate 8s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>