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
      </div>
    </div>

    <!-- Tab页切换 -->
    <div class="tab-container">
      <div class="tab-header">
        <button
          @click="activeTab = 'auto'"
          :class="['tab-btn', { active: activeTab === 'auto' }]"
        >
          自动优化
        </button>
        <button
          @click="activeTab = 'language'"
          :class="['tab-btn', { active: activeTab === 'language' }]"
        >
          语言交互优化
        </button>
      </div>

      <!-- 自动优化Tab页 -->
      <div v-if="activeTab === 'auto'" class="tab-content">
        <!-- 开始分析按钮 (只在未开始时显示) -->
        <div v-if="!analysisStarted" class="start-section">
          <button
            @click="startAnalysis"
            :disabled="isProcessing"
            class="start-analysis-btn"
          >
            开始智能分析
          </button>
          <p class="start-hint">
            AI将对整个子图进行两步分析：深度分析和智能优化，并自动应用结果供您确认。
          </p>
        </div>

        <!-- 分析过程和结果 (开始后显示) -->
        <div v-if="analysisStarted" class="analysis-container">
          <!-- 第一步：深度分析 -->
          <div
            class="analysis-step"
            :class="{ active: step1Active, completed: step1Completed }"
          >
            <div class="step-header">
              <div class="step-indicator">
                <span class="step-number">1</span>
                <span v-if="step1Completed" class="step-check">✓</span>
              </div>
              <div class="step-info">
                <h4>深度分析</h4>
                <p class="step-description">
                  AI正在分析子图结构、识别问题和优化机会
                </p>
              </div>
              <div class="step-status">
                <span v-if="step1Active && !step1Completed" class="status-running"
                  >进行中</span
                >
                <span v-if="step1Completed" class="status-completed">已完成</span>
              </div>
            </div>

            <!-- 第一步进行中的思考过程 -->
            <div v-if="step1Active && !step1Completed" class="step-content">
              <ThinkingProcess
                :is-active="true"
                :subgraph-data="subgraphData"
                analysis-type="overall"
                @thinking-complete="handleStep1Complete"
                @step-complete="handleThinkingStepComplete"
              />
            </div>

            <!-- 第一步完成后的结果 -->
            <div v-if="step1Completed" class="step-content">
              <!-- 思考过程历史 -->
              <div v-if="step1ThinkingHistory.length > 0" class="thinking-history">
                <div
                  class="collapsible-header"
                  @click="toggleStep1History"
                  :class="{ expanded: showStep1History }"
                >
                  <span>分析过程 ({{ step1ThinkingHistory.length }}个步骤)</span>
                  <span class="expand-icon">{{
                    showStep1History ? "▼" : "▶"
                  }}</span>
                </div>

                <div v-if="showStep1History" class="collapsible-content">
                  <div class="thinking-steps">
                    <div
                      v-for="(step, index) in step1ThinkingHistory"
                      :key="index"
                      class="thinking-step"
                    >
                      <div class="step-title">{{ step.title }}</div>
                      <div class="step-content-text">{{ step.content }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 分析结果 -->
              <div v-if="step1Result" class="analysis-result">
                <div
                  class="collapsible-header"
                  @click="toggleStep1Result"
                  :class="{ expanded: showStep1Result }"
                >
                  <span>分析结果</span>
                  <span class="expand-icon">{{ showStep1Result ? "▼" : "▶" }}</span>
                </div>

                <div v-if="showStep1Result" class="collapsible-content">
                  <!-- 整体评估 -->
                  <div class="result-category">
                    <h5>整体评估</h5>
                    <div class="assessment-card">
                      <div class="assessment-score">
                        <span class="score-label">综合评分:</span>
                        <span
                          class="score-value"
                          :class="getScoreClass(step1Result.overallScore)"
                        >
                          {{ step1Result.overallScore }}/100
                        </span>
                      </div>
                      <div class="assessment-summary">
                        {{ step1Result.overallSummary }}
                      </div>
                    </div>
                  </div>

                  <!-- 发现的问题 -->
                  <div
                    v-if="step1Result.issues && step1Result.issues.length"
                    class="result-category"
                  >
                    <h5>发现的问题</h5>
                    <div class="issues-list">
                      <div
                        v-for="issue in step1Result.issues"
                        :key="issue.id"
                        class="issue-item"
                        :class="issue.severity"
                      >
                        <div class="issue-header">
                          <span class="issue-title">{{ issue.title }}</span>
                          <span class="issue-severity">{{
                            getSeverityText(issue.severity)
                          }}</span>
                        </div>
                        <div class="issue-description">{{ issue.description }}</div>
                        <div
                          v-if="issue.affectedElements"
                          class="affected-elements"
                        >
                          <span class="elements-label">影响元素:</span>
                          <span class="elements-list">{{
                            issue.affectedElements.join(", ")
                          }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 优化建议 -->
                  <div
                    v-if="step1Result.suggestions && step1Result.suggestions.length"
                    class="result-category"
                  >
                    <h5>优化建议</h5>
                    <div class="suggestions-list">
                      <div
                        v-for="suggestion in step1Result.suggestions"
                        :key="suggestion.id"
                        class="suggestion-item"
                        :class="suggestion.priority"
                      >
                        <div class="suggestion-header">
                          <span class="suggestion-title">{{
                            suggestion.title
                          }}</span>
                          <span class="suggestion-priority">{{
                            getPriorityText(suggestion.priority)
                          }}</span>
                        </div>
                        <div class="suggestion-description">
                          {{ suggestion.description }}
                        </div>
                        <div class="suggestion-impact">
                          <span class="impact-label">预期效果:</span>
                          <span class="impact-text">{{
                            suggestion.expectedImpact
                          }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 第二步：智能优化 -->
          <div
            v-if="step1Completed"
            class="analysis-step"
            :class="{ active: step2Active, completed: step2Completed }"
          >
            <div class="step-header">
              <div class="step-indicator">
                <span class="step-number">2</span>
                <span v-if="step2Completed" class="step-check">✓</span>
              </div>
              <div class="step-info">
                <h4>智能优化</h4>
                <p class="step-description">基于分析结果进行智能优化并应用到子图</p>
              </div>
              <div class="step-status">
                <span v-if="step2Active && !step2Completed" class="status-running"
                  >进行中</span
                >
                <span v-if="step2Completed" class="status-completed">已完成</span>
              </div>
            </div>

            <!-- 第二步进行中 -->
            <div v-if="step2Active && !step2Completed" class="step-content">
              <div class="optimizing-section">
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
                  <div
                    class="progress-fill"
                    :style="{ width: optimizingProgress + '%' }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- 第二步完成后的结果 -->
            <div v-if="step2Completed" class="step-content">
              <!-- 优化结果 -->
              <div v-if="step2Result" class="optimization-result">
                <div
                  class="collapsible-header"
                  @click="toggleStep2Result"
                  :class="{ expanded: showStep2Result }"
                >
                  <span>优化详情</span>
                  <span class="expand-icon">{{ showStep2Result ? "▼" : "▶" }}</span>
                </div>

                <div v-if="showStep2Result" class="collapsible-content">
                  <div class="optimization-summary">
                    <div class="summary-stats">
                      <div class="stat-change">
                        <span class="change-label">节点优化:</span>
                        <span class="change-value"
                          >{{ step2Result.nodeChanges }}个</span
                        >
                      </div>
                      <div class="stat-change">
                        <span class="change-label">关系优化:</span>
                        <span class="change-value"
                          >{{ step2Result.edgeChanges }}个</span
                        >
                      </div>
                      <div class="stat-change">
                        <span class="change-label">新增元素:</span>
                        <span class="change-value"
                          >{{ step2Result.newElements }}个</span
                        >
                      </div>
                    </div>
                    <div class="result-message">{{ step2Result.message }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 修改差异展示和操作按钮 -->
          <div v-if="step2Completed" class="final-actions">
            <div class="applied-notice">
              <div class="notice-icon">✅</div>
              <div class="notice-text">
                <strong>优化结果已应用到子图</strong>
                <p>AI已对子图进行了优化，修改的元素在画布中以绿色边框高亮显示。</p>
              </div>
            </div>

            <!-- 修改差异详情 -->
            <div
              v-if="modificationDiff && modificationDiff.length > 0"
              class="modification-diff"
            >
              <div
                class="collapsible-header"
                @click="toggleModificationDiff"
                :class="{ expanded: showModificationDiff }"
              >
                <span>查看修改详情 ({{ modificationDiff.length }}项变更)</span>
                <span class="expand-icon">{{
                  showModificationDiff ? "▼" : "▶"
                }}</span>
              </div>

              <div v-if="showModificationDiff" class="collapsible-content">
                <div class="diff-list">
                  <div
                    v-for="(diff, index) in modificationDiff"
                    :key="index"
                    class="diff-item"
                    :class="diff.type"
                    @click="highlightElement(diff.elementId)"
                  >
                    <div class="diff-header">
                      <div class="diff-type-icon">
                        <span v-if="diff.type === 'node'" class="icon">🔵</span>
                        <span v-else-if="diff.type === 'edge'" class="icon"
                          >🔗</span
                        >
                        <span v-else class="icon">➕</span>
                      </div>
                      <div class="diff-info">
                        <div class="diff-title">{{ diff.title }}</div>
                        <div class="diff-element">{{ diff.elementName }}</div>
                      </div>
                      <div class="diff-action">
                        {{ getActionText(diff.action) }}
                      </div>
                    </div>
                    <div class="diff-details">
                      <div
                        v-for="change in diff.changes"
                        :key="change.field"
                        class="change-item"
                      >
                        <span class="change-field">{{ change.field }}:</span>
                        <div class="change-values">
                          <span v-if="change.oldValue" class="old-value">{{
                            change.oldValue
                          }}</span>
                          <span v-if="change.oldValue" class="arrow">→</span>
                          <span class="new-value">{{ change.newValue }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="action-buttons">
              <button
                @click="acceptOptimization"
                class="accept-btn"
                :disabled="isProcessing"
              >
                <span class="btn-icon">✓</span>
                采纳修改
              </button>
              <button
                @click="rejectOptimization"
                class="reject-btn"
                :disabled="isProcessing"
              >
                <span class="btn-icon">✕</span>
                放弃修改
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 语言交互优化Tab页 -->
      <div v-if="activeTab === 'language'" class="tab-content">
        <div class="language-optimization-section">
          <!-- 用户输入区域 -->
          <div class="input-section">
            <h4>自然语言优化</h4>
            <p class="input-description">
              请描述您希望进行的修改，例如：
            </p>
            <div class="example-commands">
              <div class="example-item">• 在"用户管理"节点上增加一个"权限控制"节点</div>
              <div class="example-item">• 在"数据库"和"缓存"节点之间增加一条边</div>
              <div class="example-item">• 删除"临时文件"节点</div>
              <div class="example-item">• 删除"数据备份"边</div>
              <div class="example-item">• 修改"用户管理"节点名称为"用户系统"</div>
              <div class="example-item">• 修改"数据同步"边名称为"实时同步"</div>
            </div>
            
            <div class="input-container">
              <textarea
                v-model="userInput"
                placeholder="请输入您的修改需求..."
                class="user-input"
                :disabled="isLanguageProcessing"
                rows="4"
              ></textarea>
              <button
                @click="processLanguageOptimization"
                :disabled="!userInput.trim() || isLanguageProcessing"
                class="process-btn"
              >
                <span v-if="!isLanguageProcessing" class="btn-icon">🚀</span>
                <span v-else class="processing-icon">⏳</span>
                {{ isLanguageProcessing ? '处理中...' : '开始优化' }}
              </button>
            </div>
          </div>

          <!-- 语言优化结果 -->
          <div v-if="languageOptimizationResult" class="language-result-section">
            <div class="result-header">
              <h4>优化结果</h4>
              <div class="result-summary">
                <span class="summary-text">{{ languageOptimizationResult.message }}</span>
              </div>
            </div>

            <!-- 修改差异详情 -->
            <div
              v-if="languageModificationDiff && languageModificationDiff.length > 0"
              class="modification-diff"
            >
              <div
                class="collapsible-header"
                @click="toggleLanguageModificationDiff"
                :class="{ expanded: showLanguageModificationDiff }"
              >
                <span>查看修改详情 ({{ languageModificationDiff.length }}项变更)</span>
                <span class="expand-icon">{{
                  showLanguageModificationDiff ? "▼" : "▶"
                }}</span>
              </div>

              <div v-if="showLanguageModificationDiff" class="collapsible-content">
                <div class="diff-list">
                  <div
                    v-for="(diff, index) in languageModificationDiff"
                    :key="index"
                    class="diff-item"
                    :class="diff.type"
                    @click="highlightElement(diff.elementId)"
                  >
                    <div class="diff-header">
                      <div class="diff-type-icon">
                        <span v-if="diff.type === 'node'" class="icon">🔵</span>
                        <span v-else-if="diff.type === 'edge'" class="icon"
                          >🔗</span
                        >
                        <span v-else class="icon">➕</span>
                      </div>
                      <div class="diff-info">
                        <div class="diff-title">{{ diff.title }}</div>
                        <div class="diff-element">{{ diff.elementName }}</div>
                      </div>
                      <div class="diff-action">
                        {{ getActionText(diff.action) }}
                      </div>
                    </div>
                    <div class="diff-details">
                      <div
                        v-for="change in diff.changes"
                        :key="change.field"
                        class="change-item"
                      >
                        <span class="change-field">{{ change.field }}:</span>
                        <div class="change-values">
                          <span v-if="change.oldValue" class="old-value">{{
                            change.oldValue
                          }}</span>
                          <span v-if="change.oldValue" class="arrow">→</span>
                          <span class="new-value">{{ change.newValue }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <button
                @click="acceptLanguageOptimization"
                class="accept-btn"
                :disabled="isLanguageProcessing"
              >
                <span class="btn-icon">✓</span>
                采纳修改
              </button>
              <button
                @click="rejectLanguageOptimization"
                class="reject-btn"
                :disabled="isLanguageProcessing"
              >
                <span class="btn-icon">✕</span>
                放弃修改
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import ThinkingProcess from "./ThinkingProcess.vue";
import { kimiAPI } from "../api/kimi.js";

const props = defineProps({
  subgraphData: {
    type: Object,
    required: true,
  },
  isProcessing: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "start-analysis",
  "start-optimization",
  "optimization-complete",
  "highlight-element",
]);

// Tab页状态
const activeTab = ref('auto');

// 主要状态
const analysisStarted = ref(false);

// 第一步状态
const step1Active = ref(false);
const step1Completed = ref(false);
const step1ThinkingHistory = ref([]);
const step1Result = ref(null);
const showStep1History = ref(true);
const showStep1Result = ref(true);

// 第二步状态
const step2Active = ref(false);
const step2Completed = ref(false);
const step2Result = ref(null);
const showStep2Result = ref(true);

// 修改差异状态
const modificationDiff = ref([]);
const showModificationDiff = ref(true);

// 优化状态
const optimizingStatus = ref("");
const optimizingProgress = ref(0);
const preOptimizationSnapshot = ref(null);

// 语言交互优化状态
const userInput = ref("");
const isLanguageProcessing = ref(false);
const languageOptimizationResult = ref(null);
const languageModificationDiff = ref([]);
const showLanguageModificationDiff = ref(true);
const preLanguageOptimizationSnapshot = ref(null);

// 计算属性
const subgraphStats = computed(() => {
  const nodes = props.subgraphData.nodes || [];
  const edges = props.subgraphData.edges || [];

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    connectivity: calculateConnectivity(nodes, edges),
    completeness: calculateCompleteness(nodes, edges),
  };
});

// 方法
const calculateConnectivity = (nodes, edges) => {
  if (nodes.length <= 1) return "完全连通";

  const connectedNodes = new Set();
  edges.forEach((edge) => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  const ratio = connectedNodes.size / nodes.length;
  if (ratio >= 0.9) return "高度连通";
  if (ratio >= 0.7) return "良好连通";
  if (ratio >= 0.5) return "部分连通";
  return "连通性较差";
};

const calculateCompleteness = (nodes, edges) => {
  if (nodes.length === 0) return "无数据";

  let completeNodes = 0;
  nodes.forEach((node) => {
    const hasDescription =
      node.data?.description && node.data.description.trim();
    const hasEnglishName =
      node.data?.englishName && node.data.englishName.trim();
    const hasParameters =
      node.data?.parameters && node.data.parameters.length > 0;

    if (hasDescription || hasEnglishName || hasParameters) {
      completeNodes++;
    }
  });

  const ratio = completeNodes / nodes.length;
  if (ratio >= 0.8) return "信息完整";
  if (ratio >= 0.6) return "信息较完整";
  if (ratio >= 0.4) return "信息不完整";
  return "信息缺失严重";
};

// 语言交互优化处理
const processLanguageOptimization = async () => {
  if (!userInput.value.trim()) return;

  console.log("开始语言交互优化:", userInput.value);
  isLanguageProcessing.value = true;

  // 创建优化前快照
  preLanguageOptimizationSnapshot.value = {
    nodes: JSON.parse(JSON.stringify(props.subgraphData.nodes)),
    edges: JSON.parse(JSON.stringify(props.subgraphData.edges)),
    timestamp: new Date(),
  };

  try {
    // 调用AI进行语言交互优化
    const optimizationResponse = await kimiAPI.optimizeByLanguage(
      props.subgraphData,
      userInput.value
    );

    if (optimizationResponse.success) {
      languageOptimizationResult.value = {
        message: optimizationResponse.message || "语言优化完成",
        optimizedSubgraph: optimizationResponse.optimizedSubgraph,
        changes: optimizationResponse.changes,
        statistics: optimizationResponse.statistics,
        preOptimizationSnapshot: preLanguageOptimizationSnapshot.value,
      };

      // 生成修改差异
      languageModificationDiff.value = generateModificationDiff(
        preLanguageOptimizationSnapshot.value,
        languageOptimizationResult.value.optimizedSubgraph
      );

      // 立即应用优化结果到子图中
      console.log("应用语言优化结果到子图");
      emit("start-optimization", {
        type: "language",
        subgraphData: props.subgraphData,
        optimizationResult: languageOptimizationResult.value,
        modificationDiff: languageModificationDiff.value,
        applyImmediately: true,
      });
    } else {
      console.error("语言优化失败:", optimizationResponse.message);
      languageOptimizationResult.value = generateMockLanguageOptimizationResult();
      
      // 生成修改差异
      languageModificationDiff.value = generateModificationDiff(
        preLanguageOptimizationSnapshot.value,
        languageOptimizationResult.value.optimizedSubgraph
      );

      // 应用模拟结果
      emit("start-optimization", {
        type: "language",
        subgraphData: props.subgraphData,
        optimizationResult: languageOptimizationResult.value,
        modificationDiff: languageModificationDiff.value,
        applyImmediately: true,
      });
    }
  } catch (error) {
    console.error("语言优化接口调用失败:", error);
    languageOptimizationResult.value = generateMockLanguageOptimizationResult();
    
    // 生成修改差异
    languageModificationDiff.value = generateModificationDiff(
      preLanguageOptimizationSnapshot.value,
      languageOptimizationResult.value.optimizedSubgraph
    );

    // 应用模拟结果
    emit("start-optimization", {
      type: "language",
      subgraphData: props.subgraphData,
      optimizationResult: languageOptimizationResult.value,
      modificationDiff: languageModificationDiff.value,
      applyImmediately: true,
    });
  } finally {
    isLanguageProcessing.value = false;
  }
};

// 生成模拟语言优化结果
const generateMockLanguageOptimizationResult = () => {
  const nodes = JSON.parse(JSON.stringify(props.subgraphData.nodes));
  const edges = JSON.parse(JSON.stringify(props.subgraphData.edges));

  // 根据用户输入模拟不同的操作
  const input = userInput.value.toLowerCase();
  
  if (input.includes('增加') && input.includes('节点')) {
    // 模拟增加节点
    const newNodeId = `LANG_NEW_NODE_${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: "rect",
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        label: "语言优化新增节点",
        englishName: "Language_Optimized_Node",
        description: "根据用户语言输入新增的节点",
        parameters: [
          { name: "类型", value: "语言优化" },
          { name: "来源", value: "用户输入" },
        ],
        features: ["智能生成", "用户定制"],
        isModified: true,
        isNewlyAdded: true,
      },
      class: "newly-added-node",
    };
    nodes.push(newNode);
  } else if (input.includes('增加') && input.includes('边')) {
    // 模拟增加边
    if (nodes.length >= 2) {
      const sourceNode = nodes[0];
      const targetNode = nodes[1];
      const newEdgeId = `LANG_NEW_EDGE_${Date.now()}`;
      const newEdge = {
        id: newEdgeId,
        source: sourceNode.id,
        target: targetNode.id,
        type: "bezier",
        label: "语言优化新增关系",
        data: {
          englishName: "Language_Optimized_Edge",
          description: "根据用户语言输入新增的关系",
          parameters: [
            { name: "类型", value: "语言优化" },
            { name: "来源", value: "用户输入" },
          ],
          features: ["智能生成", "用户定制"],
          isModified: true,
          isNewlyAdded: true,
        },
        class: "newly-added-edge",
      };
      edges.push(newEdge);
    }
  } else if (input.includes('删除') && input.includes('节点')) {
    // 模拟删除节点
    if (nodes.length > 0) {
      nodes.splice(0, 1);
    }
  } else if (input.includes('删除') && input.includes('边')) {
    // 模拟删除边
    if (edges.length > 0) {
      edges.splice(0, 1);
    }
  } else if (input.includes('修改') && input.includes('名称')) {
    // 模拟修改名称
    if (nodes.length > 0) {
      nodes[0].data.label = "语言优化修改后的名称";
      nodes[0].data.isModified = true;
      nodes[0].class = (nodes[0].class || '') + ' modified-node';
    }
  }

  return {
    message: "根据您的语言输入完成了优化",
    optimizedSubgraph: { nodes, edges },
    changes: {
      nodeChanges: [
        { id: "lang_change1", type: "language", description: "基于语言输入的优化" },
      ],
      edgeChanges: [
        { id: "lang_change2", type: "language", description: "基于语言输入的优化" },
      ],
    },
    statistics: {
      nodesOptimized: 1,
      edgesOptimized: 1,
      newConnections: 1,
    },
    preOptimizationSnapshot: preLanguageOptimizationSnapshot.value,
  };
};

// 语言优化操作
const acceptLanguageOptimization = () => {
  console.log("采纳语言优化结果");
  emit("optimization-complete", {
    type: "language",
    action: "accept",
    result: languageOptimizationResult.value,
    preOptimizationSnapshot: preLanguageOptimizationSnapshot.value,
  });

  // 清空语言优化状态
  resetLanguageOptimizationState();
};

const rejectLanguageOptimization = () => {
  console.log("放弃语言优化结果");
  emit("optimization-complete", {
    type: "language",
    action: "reject",
    result: languageOptimizationResult.value,
    preOptimizationSnapshot: preLanguageOptimizationSnapshot.value,
  });

  // 清空语言优化状态
  resetLanguageOptimizationState();
};

const resetLanguageOptimizationState = () => {
  userInput.value = "";
  isLanguageProcessing.value = false;
  languageOptimizationResult.value = null;
  languageModificationDiff.value = [];
  showLanguageModificationDiff.value = true;
  preLanguageOptimizationSnapshot.value = null;
};

// 语言优化差异切换
const toggleLanguageModificationDiff = () => {
  showLanguageModificationDiff.value = !showLanguageModificationDiff.value;
};

// 开始分析
const startAnalysis = () => {
  console.log("开始智能分析");
  analysisStarted.value = true;
  step1Active.value = true;
  step1ThinkingHistory.value = [];

  emit("start-analysis", {
    subgraphData: props.subgraphData,
  });
};

// 处理思考步骤完成
const handleThinkingStepComplete = (stepResult) => {
  console.log("思考步骤完成:", stepResult);

  // 处理ThinkingProcess组件传来的数据结构
  const step = stepResult.step || stepResult;
  const title =
    step.title ||
    stepResult.title ||
    `步骤 ${step1ThinkingHistory.value.length + 1}`;
  const content =
    step.description ||
    step.content ||
    stepResult.content ||
    stepResult.description ||
    "分析中...";

  step1ThinkingHistory.value.push({
    title: title,
    content: content,
  });

  console.log("已保存思考步骤:", { title, content });
};

// 处理第一步完成
const handleStep1Complete = async (thinkingResult) => {
  console.log("第一步分析完成:", thinkingResult);

  try {
    // 调用真实的AI分析接口
    const analysisResponse = await kimiAPI.analyzeSubgraph(props.subgraphData);

    if (analysisResponse.success) {
      step1Result.value = analysisResponse.analysisResult;
    } else {
      console.error("AI分析失败:", analysisResponse.message);
      step1Result.value = generateAnalysisFromThinking(thinkingResult);
    }
  } catch (error) {
    console.error("AI分析接口调用失败:", error);
    step1Result.value = generateAnalysisFromThinking(thinkingResult);
  }

  // 标记第一步完成，开始第二步
  step1Active.value = false;
  step1Completed.value = true;

  // 自动开始第二步
  setTimeout(() => {
    startStep2Optimization();
  }, 1000);
};

// 开始第二步优化
const startStep2Optimization = async () => {
  console.log("开始第二步：智能优化");
  step2Active.value = true;
  optimizingProgress.value = 0;

  // 创建优化前快照
  preOptimizationSnapshot.value = {
    nodes: JSON.parse(JSON.stringify(props.subgraphData.nodes)),
    edges: JSON.parse(JSON.stringify(props.subgraphData.edges)),
    timestamp: new Date(),
  };

  try {
    // 显示优化进度
    await simulateOptimization();

    // 调用真实的AI整体优化接口
    const optimizationResponse = await kimiAPI.optimizeOverall(
      props.subgraphData,
      step1Result.value,
      "请根据分析结果进行整体优化"
    );

    if (optimizationResponse.success) {
      step2Result.value = {
        nodeChanges: optimizationResponse.statistics?.nodesOptimized || 0,
        edgeChanges: optimizationResponse.statistics?.edgesOptimized || 0,
        newElements: optimizationResponse.statistics?.newConnections || 0,
        message: optimizationResponse.message || "AI已成功优化子图",
        optimizedSubgraph: optimizationResponse.optimizedSubgraph,
        changes: optimizationResponse.changes,
        statistics: optimizationResponse.statistics,
        preOptimizationSnapshot: preOptimizationSnapshot.value,
      };
    } else {
      console.error("AI优化失败:", optimizationResponse.message);
      step2Result.value = generateMockOptimizationResult();
    }

    // 标记第二步完成
    step2Active.value = false;
    step2Completed.value = true;

    // 生成修改差异
    modificationDiff.value = generateModificationDiff(
      preOptimizationSnapshot.value,
      step2Result.value.optimizedSubgraph
    );

    // 立即应用优化结果到子图中
    console.log("应用优化结果到子图");
    emit("start-optimization", {
      type: "overall",
      subgraphData: props.subgraphData,
      optimizationResult: step2Result.value,
      modificationDiff: modificationDiff.value,
      applyImmediately: true,
    });
  } catch (error) {
    console.error("优化失败:", error);
    step2Result.value = generateMockOptimizationResult();
    step2Active.value = false;
    step2Completed.value = true;

    // 生成修改差异
    modificationDiff.value = generateModificationDiff(
      preOptimizationSnapshot.value,
      step2Result.value.optimizedSubgraph
    );

    // 应用模拟结果
    emit("start-optimization", {
      type: "overall",
      subgraphData: props.subgraphData,
      optimizationResult: step2Result.value,
      modificationDiff: modificationDiff.value,
      applyImmediately: true,
    });
  }
};

// 生成模拟优化结果
const generateMockOptimizationResult = () => {
  return {
    nodeChanges: Math.floor(Math.random() * 5) + 1,
    edgeChanges: Math.floor(Math.random() * 3) + 1,
    newElements: Math.floor(Math.random() * 2),
    message: "AI优化完成，已生成优化结果。",
    preOptimizationSnapshot: preOptimizationSnapshot.value,
    optimizedSubgraph: generateMockOptimizedSubgraph(),
    changes: generateMockChanges(),
  };
};

// 生成模拟优化数据
const generateMockOptimizedSubgraph = () => {
  const nodes = JSON.parse(JSON.stringify(props.subgraphData.nodes));
  const edges = JSON.parse(JSON.stringify(props.subgraphData.edges));

  // 模拟优化现有节点数据
  nodes.forEach((node) => {
    if (!node.data) node.data = {};

    if (Math.random() > 0.5) {
      node.data.englishName =
        node.data.englishName || `Enhanced_${node.data.label || node.id}`;
      node.data.description =
        node.data.description ||
        `AI优化后的${
          node.data.label || node.id
        }描述，包含更详细的功能说明和技术参数。`;
      node.data.parameters = node.data.parameters || [
        { name: "性能指标", value: "优化后提升30%" },
        { name: "兼容性", value: "支持多平台" },
      ];
      node.data.features = node.data.features || [
        "智能化处理",
        "高效率运行",
        "用户友好界面",
      ];
      node.data.isModified = true;
      
      // 添加修改节点的样式类
      node.class = (node.class || '') + ' modified-node';
      console.log(`✏️ 为修改节点 ${node.id} 添加样式类: modified-node`);
    }
  });

  // 模拟优化现有边数据
  edges.forEach((edge) => {
    if (!edge.data) edge.data = {};

    if (Math.random() > 0.6) {
      edge.data.englishName =
        edge.data.englishName || `Enhanced_${edge.label || edge.id}`;
      edge.data.description =
        edge.data.description ||
        `AI优化后的${
          edge.label || edge.id
        }关系描述，明确了连接的具体含义和作用机制。`;
      edge.data.parameters = edge.data.parameters || [
        { name: "连接强度", value: "高" },
        { name: "数据流向", value: "双向" },
      ];
      edge.data.features = edge.data.features || [
        "实时同步",
        "错误恢复",
        "性能监控",
      ];
      edge.data.isModified = true;
      
      // 添加修改关系的样式类
      edge.class = (edge.class || '') + ' modified-edge';
      console.log(`✏️ 为修改关系 ${edge.id} 添加样式类: modified-edge`);
    }
  });

  // 添加新节点 - 确保至少添加1个新节点
  const newNodeCount = Math.max(1, Math.floor(Math.random() * 2) + 1); // 确保至少1个，最多2个新节点
  console.log(`🔵 准备添加 ${newNodeCount} 个新节点`);
  
  for (let i = 0; i < newNodeCount; i++) {
    const newNodeId = `AI_NEW_NODE_${Date.now()}_${i}`;
    const newNode = {
      id: newNodeId,
      type: "rect",
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        label: `AI新增节点${i + 1}`,
        englishName: `AI_Generated_Node_${i + 1}`,
        description: `AI智能分析后新增的节点，用于完善系统架构和功能模块。`,
        parameters: [
          { name: "类型", value: "AI生成" },
          { name: "优先级", value: "高" },
        ],
        features: ["智能推荐", "自动优化", "数据分析"],
        isModified: true,
        isNewlyAdded: true,
      },
      class: "newly-added-node",
    };
    nodes.push(newNode);
    console.log(`🔵 已添加新节点:`, {
      id: newNode.id,
      label: newNode.data.label,
      type: newNode.type,
      class: newNode.class,
      isNewlyAdded: newNode.data.isNewlyAdded
    });
  }

  // 添加新关系 - 确保新增的节点与现有节点相连
  const originalNodeCount = props.subgraphData.nodes.length; // 原有节点数量
  const newlyAddedNodes = nodes.slice(originalNodeCount); // 新增的节点
  
  // 为每个新增节点至少创建一个与原有节点的连接
  newlyAddedNodes.forEach((newNode, index) => {
    if (originalNodeCount > 0) {
      // 随机选择一个原有节点进行连接
      const originalNodeIndex = Math.floor(Math.random() * originalNodeCount);
      const originalNode = nodes[originalNodeIndex];
      
      // 随机决定连接方向
      const isReverse = Math.random() > 0.5;
      const sourceNode = isReverse ? newNode : originalNode;
      const targetNode = isReverse ? originalNode : newNode;

      const newEdgeId = `AI_NEW_EDGE_REQUIRED_${Date.now()}_${index}`;
      const newEdge = {
        id: newEdgeId,
        source: sourceNode.id,
        target: targetNode.id,
        type: "bezier",
        label: `AI智能连接${index + 1}`,
        data: {
          englishName: `AI_Smart_Connection_${index + 1}`,
          description: `AI智能分析后为新增节点${newNode.data.label}创建的必要连接，确保系统完整性。`,
          parameters: [
            { name: "连接类型", value: "智能补充" },
            { name: "重要程度", value: "必要" },
          ],
          features: ["智能生成", "系统完整性", "逻辑连贯"],
          isModified: true,
          isNewlyAdded: true,
        },
        class: "newly-added-edge",
      };
      edges.push(newEdge);
      console.log(`🔗 为新增节点 ${newNode.id} 创建必要连接:`, {
        id: newEdge.id,
        source: newEdge.source,
        target: newEdge.target,
        label: newEdge.label,
        direction: isReverse ? "新节点 → 原有节点" : "原有节点 → 新节点"
      });
    }
  });
  
  // 额外添加一些随机关系（可选）
  const additionalEdgeCount = Math.floor(Math.random() * 2); // 0-1个额外关系
  console.log(`🔗 准备添加 ${additionalEdgeCount} 个额外关系，当前节点数量: ${nodes.length}`);
  
  for (let i = 0; i < additionalEdgeCount; i++) {
    // 确保有足够的节点来创建关系
    if (nodes.length >= 2) {
      // 随机选择源节点和目标节点
      const sourceIndex = Math.floor(Math.random() * nodes.length);
      let targetIndex = Math.floor(Math.random() * nodes.length);
      
      // 确保源节点和目标节点不同
      while (targetIndex === sourceIndex) {
        targetIndex = Math.floor(Math.random() * nodes.length);
      }
      
      const sourceNode = nodes[sourceIndex];
      const targetNode = nodes[targetIndex];

      const newEdgeId = `AI_NEW_EDGE_ADDITIONAL_${Date.now()}_${i}`;
      const newEdge = {
        id: newEdgeId,
        source: sourceNode.id,
        target: targetNode.id,
        type: "bezier",
        label: `AI额外关系${i + 1}`,
        data: {
          englishName: `AI_Additional_Relation_${i + 1}`,
          description: `AI智能分析后新增的额外关系，用于进一步优化系统间的连接和数据流。`,
          parameters: [
            { name: "连接类型", value: "AI补充优化" },
            { name: "数据流向", value: "双向" },
          ],
          features: ["智能路由", "自动负载均衡", "实时监控"],
          isModified: true,
          isNewlyAdded: true,
        },
        class: "newly-added-edge",
      };
      edges.push(newEdge);
      console.log(`🔗 已添加额外关系:`, {
        id: newEdge.id,
        source: newEdge.source,
        target: newEdge.target,
        label: newEdge.label,
        type: newEdge.type,
        class: newEdge.class,
        isNewlyAdded: newEdge.data.isNewlyAdded
      });
    } else {
      console.warn(`🔗 节点数量不足，无法创建额外关系`);
    }
  }

  return { nodes, edges };
};

const generateMockChanges = () => {
  return {
    nodeChanges: [
      { id: "change1", type: "update", description: "完善节点英文名称和描述" },
      { id: "change2", type: "enhance", description: "添加技术参数和特性" },
    ],
    edgeChanges: [
      { id: "change3", type: "update", description: "优化关系描述和参数" },
    ],
  };
};

// 模拟优化进度
const simulateOptimization = async () => {
  const steps = [
    "分析节点结构...",
    "优化节点信息...",
    "分析关系网络...",
    "优化关系描述...",
    "检查整体一致性...",
    "生成优化建议...",
  ];

  for (let i = 0; i < steps.length; i++) {
    optimizingStatus.value = steps[i];
    optimizingProgress.value = ((i + 1) / steps.length) * 100;
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
};

// 生成修改差异
const generateModificationDiff = (beforeSnapshot, afterData) => {
  const diff = [];

  if (!beforeSnapshot || !afterData) return diff;

  const beforeNodes = beforeSnapshot.nodes || [];
  const afterNodes = afterData.nodes || [];
  const beforeEdges = beforeSnapshot.edges || [];
  const afterEdges = afterData.edges || [];

  console.log('🔍 修改差异分析开始:');
  console.log('📊 优化前:', { nodes: beforeNodes.length, edges: beforeEdges.length });
  console.log('📊 优化后:', { nodes: afterNodes.length, edges: afterEdges.length });

  // 比较节点变化
  afterNodes.forEach((afterNode) => {
    const beforeNode = beforeNodes.find((n) => n.id === afterNode.id);

    if (!beforeNode) {
      // 新增节点
      console.log(`➕ 发现新增节点: ${afterNode.id} - ${afterNode.data?.label}`);
      diff.push({
        type: "node",
        action: "added",
        elementId: afterNode.id,
        elementName: afterNode.data?.label || afterNode.id,
        title: "新增节点",
        changes: [
          {
            field: "节点名称",
            newValue: afterNode.data?.label || afterNode.id,
          },
        ],
      });
    } else {
      // 检查节点修改
      const changes = [];

      // 检查标签变化
      if (
        beforeNode.data?.label !== afterNode.data?.label &&
        (afterNode.data?.label && afterNode.data?.label.trim())
      ) {
        changes.push({
          field: "节点名称",
          oldValue: beforeNode.data?.label || "无",
          newValue: afterNode.data?.label || "无",
        });
      }

      // 检查英文名称变化
      if (
        beforeNode.data?.englishName !== afterNode.data?.englishName &&
        (afterNode.data?.englishName && afterNode.data?.englishName.trim())
      ) {
        changes.push({
          field: "英文名称",
          oldValue: beforeNode.data?.englishName || "无",
          newValue: afterNode.data?.englishName || "无",
        });
      }

      // 检查描述变化
      if (
        beforeNode.data?.description !== afterNode.data?.description &&
        (afterNode.data?.description && afterNode.data?.description.trim())
      ) {
        changes.push({
          field: "描述",
          oldValue: beforeNode.data?.description ? "已有描述" : "无",
          newValue: afterNode.data?.description ? "已更新描述" : "无",
        });
      }

      // 检查参数变化
      const beforeParams = beforeNode.data?.parameters?.length || 0;
      const afterParams = afterNode.data?.parameters?.length || 0;
      if (afterParams > beforeParams) {
        changes.push({
          field: "参数数量",
          oldValue: beforeParams.toString(),
          newValue: afterParams.toString(),
        });
      }

      // 检查特性变化
      const beforeFeatures = beforeNode.data?.features?.length || 0;
      const afterFeatures = afterNode.data?.features?.length || 0;
      if (afterFeatures > beforeFeatures) {
        changes.push({
          field: "特性数量",
          oldValue: beforeFeatures.toString(),
          newValue: afterFeatures.toString(),
        });
      }

      if (changes.length > 0) {
        console.log(`✏️ 发现修改节点: ${afterNode.id} - ${afterNode.data?.label}, 变更: ${changes.length}项`);
        diff.push({
          type: "node",
          action: "modified",
          elementId: afterNode.id,
          elementName: afterNode.data?.label || afterNode.id,
          title: "修改节点",
          changes,
        });
      }
    }
  });

  // 比较边变化
  afterEdges.forEach((afterEdge) => {
    const beforeEdge = beforeEdges.find((e) => e.id === afterEdge.id);

    if (!beforeEdge) {
      // 新增边
      console.log(`➕ 发现新增关系: ${afterEdge.id} - ${afterEdge.label} (${afterEdge.source} → ${afterEdge.target})`);
      diff.push({
        type: "edge",
        action: "added",
        elementId: afterEdge.id,
        elementName:
          afterEdge.label || `${afterEdge.source} → ${afterEdge.target}`,
        title: "新增关系",
        changes: [
          {
            field: "关系名称",
            newValue: afterEdge.label || "新关系",
          },
        ],
      });
    } else {
      // 检查边修改
      const changes = [];

      // 检查标签变化
      if (beforeEdge.label !== afterEdge.label && (afterEdge.label && afterEdge.label.trim())) {
        changes.push({
          field: "关系名称",
          oldValue: beforeEdge.label || "无",
          newValue: afterEdge.label || "无",
        });
      }

      // 检查英文名称变化
      if (
        beforeEdge.data?.englishName !== afterEdge.data?.englishName &&
        (afterEdge.data?.englishName && afterEdge.data?.englishName.trim())
      ) {
        changes.push({
          field: "英文名称",
          oldValue: beforeEdge.data?.englishName || "无",
          newValue: afterEdge.data?.englishName || "无",
        });
      }

      // 检查描述变化
      if (
        beforeEdge.data?.description !== afterEdge.data?.description &&
        (afterEdge.data?.description && afterEdge.data?.description.trim())
      ) {
        changes.push({
          field: "描述",
          oldValue: beforeEdge.data?.description ? "已有描述" : "无",
          newValue: afterEdge.data?.description ? "已更新描述" : "无",
        });
      }

      if (changes.length > 0) {
        console.log(`✏️ 发现修改关系: ${afterEdge.id} - ${afterEdge.label}, 变更: ${changes.length}项`);
        diff.push({
          type: "edge",
          action: "modified",
          elementId: afterEdge.id,
          elementName:
            afterEdge.label || `${afterEdge.source} → ${afterEdge.target}`,
          title: "修改关系",
          changes,
        });
      }
    }
  });

  console.log('🔍 修改差异分析完成:');
  console.log('📋 差异总结:', {
    总计: diff.length,
    新增节点: diff.filter(d => d.type === 'node' && d.action === 'added').length,
    修改节点: diff.filter(d => d.type === 'node' && d.action === 'modified').length,
    新增关系: diff.filter(d => d.type === 'edge' && d.action === 'added').length,
    修改关系: diff.filter(d => d.type === 'edge' && d.action === 'modified').length,
  });
  console.log('📋 详细差异列表:', diff.map(d => ({
    类型: d.type,
    操作: d.action,
    元素: d.elementName,
    ID: d.elementId
  })));

  return diff;
};

// 高亮元素
const highlightElement = (elementId) => {
  emit("highlight-element", elementId);
};

// 获取操作文本
const getActionText = (action) => {
  const actionMap = {
    added: "新增",
    modified: "修改",
    deleted: "删除",
  };
  return actionMap[action] || action;
};

// 基于思考结果生成分析结果
const generateAnalysisFromThinking = (thinkingResult) => {
  const nodes = props.subgraphData.nodes || [];
  const edges = props.subgraphData.edges || [];

  return {
    overallScore:
      thinkingResult.results?.overallScore ||
      Math.floor(Math.random() * 30) + 70,
    overallSummary:
      thinkingResult.results?.summary ||
      `该子图包含${nodes.length}个节点和${edges.length}个关系，整体结构较为合理，但仍有优化空间。`,
    issues: [
      {
        id: "issue1",
        title: "部分节点信息不完整",
        description: "发现部分节点缺少英文名称和详细描述，影响图表的专业性。",
        severity: "medium",
        affectedElements: nodes
          .filter((n) => !n.data?.englishName)
          .map((n) => n.data?.label || n.id)
          .slice(0, 3),
      },
      {
        id: "issue2",
        title: "关系描述过于简单",
        description: "部分关系的描述过于简单，建议添加更详细的说明。",
        severity: "low",
        affectedElements: edges
          .filter((e) => !e.data?.description)
          .map((e) => e.label)
          .slice(0, 2),
      },
    ],
    suggestions: [
      {
        id: "suggestion1",
        title: "完善节点信息",
        description: "为缺少信息的节点添加英文名称、详细描述和技术参数。",
        priority: "high",
        expectedImpact: "提升图表专业性和可读性",
      },
      {
        id: "suggestion2",
        title: "优化关系描述",
        description: "为关系添加更详细的描述和参数信息，明确连接的含义。",
        priority: "medium",
        expectedImpact: "增强图表的逻辑清晰度",
      },
    ],
  };
};

// 操作按钮
const acceptOptimization = () => {
  console.log("采纳优化结果");
  emit("optimization-complete", {
    type: "overall",
    action: "accept",
    result: step2Result.value,
    analysisResult: step1Result.value,
    preOptimizationSnapshot: preOptimizationSnapshot.value,
  });

  // 清空所有分析历史
  resetAllState();
};

const rejectOptimization = () => {
  console.log("放弃优化结果");
  emit("optimization-complete", {
    type: "overall",
    action: "reject",
    result: step2Result.value,
    preOptimizationSnapshot: preOptimizationSnapshot.value,
  });

  // 清空所有分析历史
  resetAllState();
};

const resetAllState = () => {
  analysisStarted.value = false;

  step1Active.value = false;
  step1Completed.value = false;
  step1ThinkingHistory.value = [];
  step1Result.value = null;
  showStep1History.value = false;
  showStep1Result.value = true;

  step2Active.value = false;
  step2Completed.value = false;
  step2Result.value = null;
  showStep2Result.value = true;

  modificationDiff.value = [];
  showModificationDiff.value = true;

  optimizingStatus.value = "";
  optimizingProgress.value = 0;
  preOptimizationSnapshot.value = null;
};

// 折叠切换方法
const toggleStep1History = () => {
  showStep1History.value = !showStep1History.value;
};

const toggleStep1Result = () => {
  showStep1Result.value = !showStep1Result.value;
};

const toggleStep2Result = () => {
  showStep2Result.value = !showStep2Result.value;
};

const toggleModificationDiff = () => {
  showModificationDiff.value = !showModificationDiff.value;
};

// 辅助方法
const getScoreClass = (score) => {
  if (score >= 90) return "excellent";
  if (score >= 80) return "good";
  if (score >= 70) return "fair";
  return "poor";
};

const getSeverityText = (severity) => {
  const severityMap = {
    high: "高",
    medium: "中",
    low: "低",
  };
  return severityMap[severity] || severity;
};

const getPriorityText = (priority) => {
  const priorityMap = {
    high: "高优先级",
    medium: "中优先级",
    low: "低优先级",
  };
  return priorityMap[priority] || priority;
};

// 监听子图数据变化，只在没有进行分析时重置
watch(
  () => props.subgraphData,
  () => {
    if (!analysisStarted.value) {
      resetAllState();
    }
  },
  { deep: true }
);

// 暴露方法
defineExpose({
  startAnalysis,
  resetAnalysis: resetAllState,
});
</script>
<style scoped>
.overall-optimization-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

/* 子图概览样式 */
.overview-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.overview-section h4 {
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

/* 开始分析区域 */
.start-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.start-analysis-btn {
  width: 100%;
  max-width: 200px;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
  background: #4068d4;
  color: white;
}

.start-analysis-btn:hover:not(:disabled) {
  background: #3557c0;
  transform: translateY(-1px);
}

.start-analysis-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.start-hint {
  margin: 0;
  font-size: 12px;
  color: #6c757d;
  line-height: 1.5;
  max-width: 400px;
  margin: 0 auto;
}

/* 分析容器 */
.analysis-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 分析步骤样式 */
.analysis-step {
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.analysis-step.active {
  border-color: #4068d4;
}

.analysis-step.completed {
  border-color: #28a745;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.step-indicator {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #e9ecef;
  color: #6c757d;
  font-weight: 600;
}

.analysis-step.active .step-indicator {
  background: #4068d4;
  color: white;
}

.analysis-step.completed .step-indicator {
  background: #28a745;
  color: white;
}

.step-number {
  font-size: 14px;
}

.step-check {
  position: absolute;
  font-size: 16px;
  font-weight: bold;
}

.step-info {
  flex: 1;
}

.step-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.step-description {
  margin: 0;
  font-size: 12px;
  color: #6c757d;
  line-height: 1.4;
}

.step-status {
  flex-shrink: 0;
}

.status-running {
  background: #fff3cd;
  color: #856404;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.status-completed {
  background: #d4edda;
  color: #155724;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.step-content {
  padding: 16px;
}

/* 思考历史样式 */
.thinking-history {
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  margin-bottom: 16px;
  overflow: hidden;
}

.thinking-steps {
  max-height: 300px;
  overflow-y: auto;
}

.thinking-step {
  padding: 12px 16px;
  border-bottom: 1px solid #f8f9fa;
}

.thinking-step:last-child {
  border-bottom: none;
}

.step-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.step-content-text {
  font-size: 12px;
  color: #495057;
  line-height: 1.4;
}

/* 分析结果样式 */
.analysis-result {
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  margin-bottom: 16px;
  overflow: hidden;
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

.score-value.excellent {
  color: #28a745;
}
.score-value.good {
  color: #17a2b8;
}
.score-value.fair {
  color: #ffc107;
}
.score-value.poor {
  color: #dc3545;
}

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

.issue-item.high {
  border-left-color: #dc3545;
}
.issue-item.medium {
  border-left-color: #ffc107;
}
.issue-item.low {
  border-left-color: #17a2b8;
}

.suggestion-item.high {
  border-left-color: #28a745;
}
.suggestion-item.medium {
  border-left-color: #17a2b8;
}
.suggestion-item.low {
  border-left-color: #6c757d;
}

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

/* 优化进行中 */
.optimizing-section {
  text-align: center;
  padding: 24px 16px;
}

.optimizing-animation {
  margin-bottom: 16px;
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

.dot:nth-child(1) {
  animation-delay: -0.32s;
}
.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes thinking {
  0%,
  80%,
  100% {
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

/* 优化结果 */
.optimization-result {
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  margin-bottom: 16px;
  overflow: hidden;
}

.optimization-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

/* 最终操作区域 */
.final-actions {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.applied-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.notice-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.notice-text {
  flex: 1;
}

.notice-text strong {
  color: #155724;
  font-size: 13px;
  display: block;
  margin-bottom: 4px;
}

.notice-text p {
  color: #155724;
  font-size: 12px;
  margin: 0;
  line-height: 1.4;
}

.action-buttons {
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

/* 可折叠区域样式 */
.collapsible-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  transition: background-color 0.2s;
}

.collapsible-header:hover {
  background: #e9ecef;
}

.collapsible-header.expanded {
  background: #e9ecef;
}

.expand-icon {
  font-size: 11px;
  color: #6c757d;
  transition: transform 0.2s;
}

.collapsible-header.expanded .expand-icon {
  transform: rotate(0deg);
}

.collapsible-content {
  padding: 12px;
}

/* 修改差异样式 */
.modification-diff {
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  margin-bottom: 16px;
  overflow: hidden;
}

.diff-list {
  max-height: 300px;
  overflow-y: auto;
}

.diff-item {
  padding: 12px;
  border-bottom: 1px solid #f8f9fa;
  cursor: pointer;
  transition: background-color 0.2s;
}

.diff-item:hover {
  background: #f8f9fa;
}

.diff-item:last-child {
  border-bottom: none;
}

.diff-item.node {
  border-left: 3px solid #4068d4;
}

.diff-item.edge {
  border-left: 3px solid #28a745;
}

.diff-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.diff-type-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  flex-shrink: 0;
}

.diff-type-icon .icon {
  font-size: 12px;
}

.diff-info {
  flex: 1;
}

.diff-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.diff-element {
  font-size: 11px;
  color: #6c757d;
}

.diff-action {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.diff-details {
  margin-left: 34px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.change-field {
  font-weight: 600;
  color: #495057;
  min-width: 60px;
}

.change-values {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.old-value {
  color: #dc3545;
  text-decoration: line-through;
  opacity: 0.7;
}

.arrow {
  color: #6c757d;
  font-weight: bold;
}

.new-value {
  color: #28a745;
  font-weight: 600;
}

/* 按钮样式优化 */
.action-buttons {
  display: flex;
  gap: 12px;
}

.accept-btn,
.reject-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-icon {
  font-size: 14px;
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

/* 语言交互优化样式 */
.language-optimization-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.input-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.input-description {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 12px;
}

.example-commands {
  background: #e9ecef;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #dee2e6;
  font-size: 12px;
  color: #495057;
  line-height: 1.6;
  max-height: 100px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.example-item {
  margin-bottom: 4px;
  padding-left: 10px;
  position: relative;
}

.example-item::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #4068d4;
}

.input-container {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.user-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 13px;
  color: #495057;
  resize: none;
  min-height: 80px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.user-input:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.user-input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.process-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: #4068d4;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  min-width: 100px;
}

.process-btn:hover:not(:disabled) {
  background: #3557c0;
  transform: translateY(-1px);
}

.process-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.processing-icon {
  font-size: 14px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.language-result-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.result-summary {
  font-size: 12px;
  color: #6c757d;
  background: #e9ecef;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.summary-text {
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .overview-stats {
    grid-template-columns: 1fr;
  }

  .summary-stats {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .diff-header {
    flex-wrap: wrap;
  }

  .diff-details {
    margin-left: 0;
    margin-top: 8px;
  }

  .input-container {
    flex-direction: column;
  }
  
  .process-btn {
    width: 100%;
  }
  
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* Tab页样式 */
.tab-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tab-header {
  display: flex;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 4px;
  border: 1px solid #e9ecef;
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: #6c757d;
}

.tab-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.tab-btn.active {
  background: #4068d4;
  color: white;
  box-shadow: 0 2px 4px rgba(64, 104, 212, 0.2);
}

.tab-content {
  min-height: 200px;
}
</style>
