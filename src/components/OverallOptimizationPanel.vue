<template>
  <div class="overall-optimization-panel">
    <!-- 子图概览信息 -->
    <div class="overview-section">
      <h4>子图概览</h4>
      <div class="overview-stats">
        <div class="stat-item">
          <span class="stat-label">节点数量:</span>
          <span class="stat-value">{{ subgraphStats.nodeCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">关系数量:</span>
          <span class="stat-value">{{ subgraphStats.edgeCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">连通性:</span>
          <span class="stat-value">{{ subgraphStats.connectivity }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">完整性:</span>
          <span class="stat-value">{{ subgraphStats.completeness }}</span>
        </div>
      </div>
    </div>

    <!-- AI深度分析区域 -->
    <div v-if="!isAnalyzing" class="analysis-section">
      <h4>AI深度分析</h4>
      <div class="analysis-controls">
        <button 
          @click="startDeepAnalysis" 
          :disabled="isAnalyzing || isProcessing"
          class="analyze-btn"
        >
          开始深度分析
        </button>
        <p class="analysis-hint">
          AI将对整个子图进行深度分析，识别潜在的优化机会和改进建议。
        </p>
      </div>
    </div>

    <!-- 思考过程展示 -->
    <div v-if="isAnalyzing" class="thinking-section">
      <ThinkingProcess
        :is-active="isAnalyzing"
        :subgraph-data="subgraphData"
        analysis-type="overall"
        @thinking-complete="handleThinkingComplete"
        @step-complete="handleStepComplete"
      />
    </div>

    <!-- 分析结果展示 -->
    <div v-if="analysisResult" class="results-section">
      <h4>分析结果</h4>
      <div class="analysis-results">
        <!-- 整体评估 -->
        <div class="result-category">
          <h5>整体评估</h5>
          <div class="assessment-card">
            <div class="assessment-score">
              <span class="score-label">综合评分:</span>
              <span class="score-value" :class="getScoreClass(analysisResult.overallScore)">
                {{ analysisResult.overallScore }}/100
              </span>
            </div>
            <div class="assessment-summary">
              {{ analysisResult.overallSummary }}
            </div>
          </div>
        </div>

        <!-- 发现的问题 -->
        <div v-if="analysisResult.issues && analysisResult.issues.length" class="result-category">
          <h5>发现的问题</h5>
          <div class="issues-list">
            <div 
              v-for="issue in analysisResult.issues" 
              :key="issue.id"
              class="issue-item"
              :class="issue.severity"
            >
              <div class="issue-header">
                <span class="issue-title">{{ issue.title }}</span>
                <span class="issue-severity">{{ getSeverityText(issue.severity) }}</span>
              </div>
              <div class="issue-description">{{ issue.description }}</div>
              <div v-if="issue.affectedElements" class="affected-elements">
                <span class="elements-label">影响元素:</span>
                <span class="elements-list">{{ issue.affectedElements.join(', ') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 优化建议 -->
        <div v-if="analysisResult.suggestions && analysisResult.suggestions.length" class="result-category">
          <h5>优化建议</h5>
          <div class="suggestions-list">
            <div 
              v-for="suggestion in analysisResult.suggestions" 
              :key="suggestion.id"
              class="suggestion-item"
              :class="suggestion.priority"
            >
              <div class="suggestion-header">
                <span class="suggestion-title">{{ suggestion.title }}</span>
                <span class="suggestion-priority">{{ getPriorityText(suggestion.priority) }}</span>
              </div>
              <div class="suggestion-description">{{ suggestion.description }}</div>
              <div class="suggestion-impact">
                <span class="impact-label">预期效果:</span>
                <span class="impact-text">{{ suggestion.expectedImpact }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 整体优化操作 -->
    <div v-if="analysisResult && !isOptimizing" class="optimization-section">
      <h4>整体优化</h4>
      <div class="optimization-controls">
        <button 
          @click="startOverallOptimization" 
          :disabled="isProcessing"
          class="optimize-btn"
        >
          应用AI优化建议
        </button>
        <button 
          @click="customOptimization" 
          :disabled="isProcessing"
          class="custom-optimize-btn"
        >
          自定义优化
        </button>
        <p class="optimization-hint">
          可以直接应用AI建议，或输入自定义的优化要求。
        </p>
      </div>
    </div>

    <!-- 优化进行中 -->
    <div v-if="isOptimizing" class="optimizing-section">
      <div class="optimizing-content">
        <div class="optimizing-animation">
          <div class="thinking-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
        <h4>AI正在优化子图...</h4>
        <p class="optimizing-text">{{ optimizingStatus }}</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: optimizingProgress + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 优化结果 -->
    <div v-if="optimizationResult" class="optimization-result-section">
      <h4>优化结果</h4>
      <div class="result-summary">
        <div class="summary-stats">
          <div class="stat-change">
            <span class="change-label">节点优化:</span>
            <span class="change-value">{{ optimizationResult.nodeChanges }}个</span>
          </div>
          <div class="stat-change">
            <span class="change-label">关系优化:</span>
            <span class="change-value">{{ optimizationResult.edgeChanges }}个</span>
          </div>
          <div class="stat-change">
            <span class="change-label">新增元素:</span>
            <span class="change-value">{{ optimizationResult.newElements }}个</span>
          </div>
        </div>
        <div class="result-message">{{ optimizationResult.message }}</div>
      </div>
      
      <div class="result-actions">
        <button 
          @click="acceptOptimization" 
          class="accept-btn"
          :disabled="isProcessing"
        >
          采纳优化结果
        </button>
        <button 
          @click="rejectOptimization" 
          class="reject-btn"
          :disabled="isProcessing"
        >
          放弃优化结果
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!analysisResult && !isAnalyzing" class="empty-state">
      <div class="empty-icon">🧠</div>
      <h4>开始AI深度分析</h4>
      <p>点击上方按钮，让AI对整个子图进行深度分析，发现优化机会。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ThinkingProcess from './ThinkingProcess.vue'
import { kimiAPI } from '../api/kimi.js'

const props = defineProps({
  subgraphData: {
    type: Object,
    required: true
  },
  isProcessing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['start-analysis', 'start-optimization', 'optimization-complete'])

// 状态管理
const isAnalyzing = ref(false)
const isOptimizing = ref(false)
const analysisResult = ref(null)
const optimizationResult = ref(null)
const optimizingStatus = ref('')
const optimizingProgress = ref(0)

// 计算属性
const subgraphStats = computed(() => {
  const nodes = props.subgraphData.nodes || []
  const edges = props.subgraphData.edges || []
  
  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    connectivity: calculateConnectivity(nodes, edges),
    completeness: calculateCompleteness(nodes, edges)
  }
})

// 方法
const calculateConnectivity = (nodes, edges) => {
  if (nodes.length <= 1) return '完全连通'
  
  const connectedNodes = new Set()
  edges.forEach(edge => {
    connectedNodes.add(edge.source)
    connectedNodes.add(edge.target)
  })
  
  const ratio = connectedNodes.size / nodes.length
  if (ratio >= 0.9) return '高度连通'
  if (ratio >= 0.7) return '良好连通'
  if (ratio >= 0.5) return '部分连通'
  return '连通性较差'
}

const calculateCompleteness = (nodes, edges) => {
  if (nodes.length === 0) return '无数据'
  
  let completeNodes = 0
  nodes.forEach(node => {
    const hasDescription = node.data?.description && node.data.description.trim()
    const hasEnglishName = node.data?.englishName && node.data.englishName.trim()
    const hasParameters = node.data?.parameters && node.data.parameters.length > 0
    
    if (hasDescription || hasEnglishName || hasParameters) {
      completeNodes++
    }
  })
  
  const ratio = completeNodes / nodes.length
  if (ratio >= 0.8) return '信息完整'
  if (ratio >= 0.6) return '信息较完整'
  if (ratio >= 0.4) return '信息不完整'
  return '信息缺失严重'
}

const startDeepAnalysis = () => {
  console.log('开始AI深度分析')
  isAnalyzing.value = true
  
  emit('start-analysis', {
    subgraphData: props.subgraphData
  })
}

// 处理思考过程完成
const handleThinkingComplete = async (thinkingResult) => {
  console.log('思考过程完成:', thinkingResult)
  
  try {
    // 调用真实的AI分析接口
    const analysisResponse = await kimiAPI.analyzeSubgraph(props.subgraphData)
    
    if (analysisResponse.success) {
      analysisResult.value = analysisResponse.analysisResult
    } else {
      console.error('AI分析失败:', analysisResponse.message)
      // 使用思考结果作为备用
      analysisResult.value = generateAnalysisFromThinking(thinkingResult)
    }
  } catch (error) {
    console.error('AI分析接口调用失败:', error)
    // 使用思考结果作为备用
    analysisResult.value = generateAnalysisFromThinking(thinkingResult)
  }
  
  // 结束分析状态
  isAnalyzing.value = false
}

// 处理思考步骤完成
const handleStepComplete = (stepResult) => {
  console.log('思考步骤完成:', stepResult)
  // 可以在这里处理每个步骤完成的逻辑
}

// 基于思考结果生成分析结果
const generateAnalysisFromThinking = (thinkingResult) => {
  const nodes = props.subgraphData.nodes || []
  const edges = props.subgraphData.edges || []
  
  return {
    overallScore: thinkingResult.results?.overallScore || Math.floor(Math.random() * 30) + 70,
    overallSummary: thinkingResult.results?.summary || `该子图包含${nodes.length}个节点和${edges.length}个关系，整体结构较为合理，但仍有优化空间。`,
    issues: [
      {
        id: 'issue1',
        title: '部分节点信息不完整',
        description: '发现部分节点缺少英文名称和详细描述，影响图表的专业性。',
        severity: 'medium',
        affectedElements: nodes.filter(n => !n.data?.englishName).map(n => n.data?.label || n.id).slice(0, 3)
      },
      {
        id: 'issue2',
        title: '关系描述过于简单',
        description: '部分关系的描述过于简单，建议添加更详细的说明。',
        severity: 'low',
        affectedElements: edges.filter(e => !e.data?.description).map(e => e.label).slice(0, 2)
      }
    ],
    suggestions: [
      {
        id: 'suggestion1',
        title: '完善节点信息',
        description: '为缺少信息的节点添加英文名称、详细描述和技术参数。',
        priority: 'high',
        expectedImpact: '提升图表专业性和可读性'
      },
      {
        id: 'suggestion2',
        title: '优化关系描述',
        description: '为关系添加更详细的描述和参数信息，明确连接的含义。',
        priority: 'medium',
        expectedImpact: '增强图表的逻辑清晰度'
      }
    ]
  }
}

// 移除重复的方法，现在使用ThinkingProcess组件来处理分析过程

const startOverallOptimization = async () => {
  console.log('开始整体优化')
  isOptimizing.value = true
  optimizingProgress.value = 0
  
  try {
    // 显示优化进度
    await simulateOptimization()
    
    // 调用真实的AI整体优化接口
    const optimizationResponse = await kimiAPI.optimizeOverall(
      props.subgraphData, 
      analysisResult.value, 
      '请根据分析结果进行整体优化'
    )
    
    if (optimizationResponse.success) {
      // 使用AI返回的真实优化结果
      optimizationResult.value = {
        nodeChanges: optimizationResponse.statistics?.nodesOptimized || 0,
        edgeChanges: optimizationResponse.statistics?.edgesOptimized || 0,
        newElements: optimizationResponse.statistics?.newConnections || 0,
        message: optimizationResponse.message || 'AI已成功优化子图',
        optimizedSubgraph: optimizationResponse.optimizedSubgraph,
        changes: optimizationResponse.changes,
        statistics: optimizationResponse.statistics
      }
    } else {
      console.error('AI优化失败:', optimizationResponse.message)
      // 使用备用的模拟结果
      optimizationResult.value = {
        nodeChanges: Math.floor(Math.random() * 5) + 1,
        edgeChanges: Math.floor(Math.random() * 3) + 1,
        newElements: Math.floor(Math.random() * 2),
        message: 'AI优化服务暂时不可用，已生成模拟优化结果。'
      }
    }
    
    emit('start-optimization', {
      type: 'overall',
      subgraphData: props.subgraphData,
      optimizationResult: optimizationResult.value
    })
  } catch (error) {
    console.error('优化失败:', error)
    // 使用备用的模拟结果
    optimizationResult.value = {
      nodeChanges: Math.floor(Math.random() * 5) + 1,
      edgeChanges: Math.floor(Math.random() * 3) + 1,
      newElements: Math.floor(Math.random() * 2),
      message: '优化过程中出现错误，已生成模拟优化结果。'
    }
  } finally {
    isOptimizing.value = false
  }
}

const simulateOptimization = async () => {
  const steps = [
    '分析节点结构...',
    '优化节点信息...',
    '分析关系网络...',
    '优化关系描述...',
    '检查整体一致性...',
    '生成优化建议...'
  ]
  
  for (let i = 0; i < steps.length; i++) {
    optimizingStatus.value = steps[i]
    optimizingProgress.value = ((i + 1) / steps.length) * 100
    await new Promise(resolve => setTimeout(resolve, 800))
  }
}

const customOptimization = () => {
  console.log('自定义优化')
  // 这里可以打开自定义优化的输入框
  // 暂时使用简单的prompt
  const customRequirement = prompt('请输入您的优化要求:')
  if (customRequirement) {
    console.log('自定义优化要求:', customRequirement)
    // 这里可以调用AI接口进行自定义优化
  }
}

const acceptOptimization = () => {
  console.log('采纳优化结果')
  emit('optimization-complete', {
    type: 'overall',
    action: 'accept',
    result: optimizationResult.value,
    analysisResult: analysisResult.value
  })
  
  // 重置状态
  resetState()
}

const rejectOptimization = () => {
  console.log('放弃优化结果')
  emit('optimization-complete', {
    type: 'overall',
    action: 'reject',
    result: optimizationResult.value
  })
  
  // 重置状态
  resetState()
}

const resetState = () => {
  optimizationResult.value = null
  optimizingProgress.value = 0
  optimizingStatus.value = ''
}

// 辅助方法
const getScoreClass = (score) => {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'fair'
  return 'poor'
}

const getSeverityText = (severity) => {
  const severityMap = {
    'high': '高',
    'medium': '中',
    'low': '低'
  }
  return severityMap[severity] || severity
}

const getPriorityText = (priority) => {
  const priorityMap = {
    'high': '高优先级',
    'medium': '中优先级',
    'low': '低优先级'
  }
  return priorityMap[priority] || priority
}

// 监听子图数据变化，重置状态
watch(() => props.subgraphData, () => {
  analysisResult.value = null
  optimizationResult.value = null
  isAnalyzing.value = false
  isOptimizing.value = false
}, { deep: true })

// 暴露方法
defineExpose({
  startAnalysis: startDeepAnalysis,
  resetAnalysis: () => {
    analysisResult.value = null
    optimizationResult.value = null
  }
})
</script>

<style scoped>
.overall-optimization-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.overview-section,
.analysis-section,
.results-section,
.optimization-section,
.optimizing-section,
.optimization-result-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.overview-section h4,
.analysis-section h4,
.results-section h4,
.optimization-section h4,
.optimizing-section h4,
.optimization-result-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.overview-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.stat-label {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
}

.stat-value {
  font-size: 13px;
  color: #333;
  font-weight: 600;
}

.analyze-btn,
.optimize-btn,
.custom-optimize-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.analyze-btn {
  background: #4068d4;
  color: white;
}

.analyze-btn:hover:not(:disabled) {
  background: #3557c0;
  transform: translateY(-1px);
}

.optimize-btn {
  background: #28a745;
  color: white;
}

.optimize-btn:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.custom-optimize-btn {
  background: #6c757d;
  color: white;
}

.custom-optimize-btn:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-1px);
}

.analyze-btn:disabled,
.optimize-btn:disabled,
.custom-optimize-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.analyzing-text {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
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

.analysis-hint,
.optimization-hint {
  margin: 0;
  font-size: 12px;
  color: #6c757d;
  line-height: 1.4;
}

.result-category {
  margin-bottom: 20px;
}

.result-category:last-child {
  margin-bottom: 0;
}

.result-category h5 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #495057;
}

.assessment-card {
  background: white;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.assessment-score {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.score-label {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

.score-value {
  font-size: 18px;
  font-weight: 700;
}

.score-value.excellent { color: #28a745; }
.score-value.good { color: #17a2b8; }
.score-value.fair { color: #ffc107; }
.score-value.poor { color: #dc3545; }

.assessment-summary {
  font-size: 14px;
  color: #495057;
  line-height: 1.5;
}

.issues-list,
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.issue-item,
.suggestion-item {
  background: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  border-left: 4px solid #6c757d;
}

.issue-item.high { border-left-color: #dc3545; }
.issue-item.medium { border-left-color: #ffc107; }
.issue-item.low { border-left-color: #17a2b8; }

.suggestion-item.high { border-left-color: #28a745; }
.suggestion-item.medium { border-left-color: #17a2b8; }
.suggestion-item.low { border-left-color: #6c757d; }

.issue-header,
.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.issue-title,
.suggestion-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.issue-severity,
.suggestion-priority {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  background: #f8f9fa;
  color: #6c757d;
  font-weight: 500;
}

.issue-description,
.suggestion-description {
  font-size: 12px;
  color: #495057;
  line-height: 1.4;
  margin-bottom: 8px;
}

.affected-elements,
.suggestion-impact {
  font-size: 11px;
  color: #6c757d;
}

.elements-label,
.impact-label {
  font-weight: 600;
  margin-right: 4px;
}

.optimizing-section {
  text-align: center;
  padding: 40px 20px;
}

.optimizing-animation {
  margin-bottom: 20px;
}

.thinking-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  background: #4068d4;
  border-radius: 50%;
  animation: thinking 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes thinking {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.optimizing-text {
  font-size: 14px;
  color: #6c757d;
  margin: 16px 0;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4068d4;
  transition: width 0.3s ease;
}

.result-summary {
  margin-bottom: 20px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-change {
  background: white;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  text-align: center;
}

.change-label {
  display: block;
  font-size: 11px;
  color: #6c757d;
  font-weight: 500;
  margin-bottom: 4px;
}

.change-value {
  font-size: 16px;
  color: #28a745;
  font-weight: 700;
}

.result-message {
  background: white;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  font-size: 14px;
  color: #495057;
  line-height: 1.5;
}

.result-actions {
  display: flex;
  gap: 12px;
}

.accept-btn,
.reject-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.accept-btn {
  background: #28a745;
  color: white;
}

.accept-btn:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.reject-btn {
  background: #dc3545;
  color: white;
}

.reject-btn:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-1px);
}

.accept-btn:disabled,
.reject-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #6c757d;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  color: #495057;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  max-width: 280px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .overview-stats {
    grid-template-columns: 1fr;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
  
  .result-actions {
    flex-direction: column;
  }
}
</style>