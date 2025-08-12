# 子图聚焦编辑功能设计文档

## 概述

本设计文档描述了子图聚焦编辑功能的技术实现方案。该功能在现有子图高亮功能基础上，提供独立的子图编辑环境，支持本体优化、关系优化和整体智能优化，通过AI辅助提升图表编辑的智能化水平。

## 架构设计

### 整体架构

```
FinalCanvas.vue (主画布)
├── 子图高亮功能 (已实现)
├── 聚焦编辑入口
└── SubgraphFocusEditor.vue (新组件)
    ├── 子图编辑画布
    ├── 顶部工具栏
    │   ├── 本体优化按钮
    │   ├── 关系优化按钮
    │   ├── 整体智能优化按钮
    │   └── 返回按钮
    ├── 右侧编辑面板
    │   ├── EntityOptimizationPanel.vue (本体优化面板)
    │   ├── RelationOptimizationPanel.vue (关系优化面板)
    │   └── OverallOptimizationPanel.vue (整体优化面板)
    └── AI优化服务
        ├── 差异对比组件
        ├── 气泡输入框组件
        └── 思考过程展示组件
```

### 核心组件设计

#### 1. SubgraphFocusEditor.vue (主编辑器组件)

**职责：**
- 管理子图编辑的整体状态
- 控制画布显示和面板切换
- 处理数据的深拷贝和融合
- 协调各个子组件的交互

**核心状态：**
```javascript
const editorState = reactive({
  isActive: false,           // 是否处于编辑模式
  subgraphData: {           // 深拷贝的子图数据
    nodes: [],
    edges: []
  },
  originalData: {           // 原始完整图数据引用
    nodes: [],
    edges: []
  },
  currentMode: 'none',      // 'entity' | 'relation' | 'overall' | 'none'
  modifications: new Map(), // 记录所有修改
  isProcessing: false       // AI处理状态
})
```

#### 2. EntityOptimizationPanel.vue (本体优化面板)

**功能特性：**
- 节点选择下拉框
- 节点详细信息展示
- AI优化输入和处理
- 差异对比展示

**核心接口：**
```javascript
// 节点选择
function selectEntity(nodeId) {
  currentEntity.value = subgraphData.nodes.find(n => n.id === nodeId)
  displayEntityDetails(currentEntity.value)
}

// AI优化处理
async function optimizeEntity(nodeId, userInput) {
  const result = await aiService.optimizeEntity(currentEntity.value, userInput)
  showDifference(currentEntity.value, result.optimizedEntity)
}
```

#### 3. RelationOptimizationPanel.vue (关系优化面板)

**功能特性：**
- 边选择下拉框
- 边详细信息展示
- AI优化输入和处理
- 差异对比展示

**核心接口：**
```javascript
// 关系选择
function selectRelation(edgeId) {
  currentRelation.value = subgraphData.edges.find(e => e.id === edgeId)
  displayRelationDetails(currentRelation.value)
}

// AI优化处理
async function optimizeRelation(edgeId, userInput) {
  const result = await aiService.optimizeRelation(currentRelation.value, userInput)
  showDifference(currentRelation.value, result.optimizedRelation)
}
```

#### 4. OverallOptimizationPanel.vue (整体优化面板)

**功能特性：**
- 深度分析过程展示
- 思考过程可视化
- 整体优化结果展示
- 采纳/放弃选择

**核心接口：**
```javascript
// 整体优化处理
async function performOverallOptimization() {
  showThinkingProcess(true)
  
  const analysisResult = await aiService.analyzeSubgraph(
    subgraphData, 
    originalCompleteData
  )
  
  displayAnalysisProcess(analysisResult.thinkingSteps)
  
  const optimizedSubgraph = await aiService.optimizeOverall(
    subgraphData, 
    analysisResult
  )
  
  showOptimizationResult(optimizedSubgraph)
}
```

## 数据模型设计

### 子图数据结构

```javascript
// 子图编辑数据模型
const SubgraphEditData = {
  metadata: {
    originalSubgraphId: string,    // 原始子图标识
    centerNodeId: string,          // 中心节点ID
    createdAt: timestamp,          // 创建时间
    lastModified: timestamp        // 最后修改时间
  },
  nodes: [
    {
      id: string,
      data: {
        label: string,
        // 原有属性
        englishName: string,
        description: string,
        parameters: array,
        features: array,
        // 编辑状态
        isModified: boolean,
        modificationHistory: array
      },
      position: { x: number, y: number },
      type: string
    }
  ],
  edges: [
    {
      id: string,
      source: string,
      target: string,
      label: string,
      data: {
        // 原有属性
        englishName: string,
        description: string,
        parameters: array,
        features: array,
        // 编辑状态
        isModified: boolean,
        modificationHistory: array
      }
    }
  ]
}
```

### 修改记录数据结构

```javascript
// 修改记录模型
const ModificationRecord = {
  id: string,
  type: 'entity' | 'relation' | 'overall',
  targetId: string,              // 目标元素ID
  timestamp: timestamp,
  userInput: string,             // 用户输入的修改想法
  aiResponse: object,            // AI返回的完整响应
  changes: {
    before: object,              // 修改前的数据
    after: object,               // 修改后的数据
    diff: array                  // 具体差异列表
  },
  status: 'pending' | 'accepted' | 'rejected'
}
```

## AI服务接口设计

### 1. 本体优化接口

```javascript
// AI本体优化服务
const EntityOptimizationService = {
  async optimizeEntity(entity, userInput, context) {
    const prompt = `
    你是一名工业知识建模专家。请根据用户的修改想法优化以下本体（节点）：
    
    当前本体信息：${JSON.stringify(entity, null, 2)}
    用户修改想法：${userInput}
    上下文信息：${JSON.stringify(context, null, 2)}
    
    请返回优化后的本体信息，格式如下：
    {
      "optimizedEntity": {优化后的完整本体对象},
      "changes": [
        {
          "field": "字段名",
          "before": "修改前的值",
          "after": "修改后的值",
          "reason": "修改原因"
        }
      ],
      "summary": "优化总结"
    }
    `
    
    return await kimiAPI.optimizeEntity(prompt)
  }
}
```

### 2. 关系优化接口

```javascript
// AI关系优化服务
const RelationOptimizationService = {
  async optimizeRelation(relation, userInput, context) {
    const prompt = `
    你是一名工业知识建模专家。请根据用户的修改想法优化以下关系（边）：
    
    当前关系信息：${JSON.stringify(relation, null, 2)}
    用户修改想法：${userInput}
    上下文信息：${JSON.stringify(context, null, 2)}
    
    请返回优化后的关系信息，格式与本体优化类似。
    `
    
    return await kimiAPI.optimizeRelation(prompt)
  }
}
```

### 3. 整体优化接口

```javascript
// AI整体优化服务
const OverallOptimizationService = {
  async analyzeSubgraph(subgraph, completeGraph) {
    const prompt = `
    你是一名工业知识建模专家。请深度分析以下子图，识别可能的问题和改进点：
    
    当前子图：${JSON.stringify(subgraph, null, 2)}
    完整图表：${JSON.stringify(completeGraph, null, 2)}
    
    请按以下步骤进行分析：
    1. 分析子图的完整性
    2. 识别缺失的节点
    3. 识别缺失的关系
    4. 检查属性完整性
    5. 提出优化建议
    
    返回格式：
    {
      "thinkingSteps": [
        {
          "step": 1,
          "title": "分析步骤标题",
          "content": "分析内容",
          "findings": ["发现1", "发现2"]
        }
      ],
      "issues": [
        {
          "type": "missing_node" | "missing_relation" | "incomplete_attribute",
          "description": "问题描述",
          "severity": "high" | "medium" | "low"
        }
      ],
      "recommendations": ["建议1", "建议2"]
    }
    `
    
    return await kimiAPI.analyzeSubgraph(prompt)
  },
  
  async optimizeOverall(subgraph, analysisResult) {
    const prompt = `
    基于分析结果，请对子图进行整体优化：
    
    当前子图：${JSON.stringify(subgraph, null, 2)}
    分析结果：${JSON.stringify(analysisResult, null, 2)}
    
    请返回优化后的完整子图。
    `
    
    return await kimiAPI.optimizeOverall(prompt)
  }
}
```

## 用户界面设计

### 1. 主编辑器布局

```vue
<template>
  <div class="subgraph-focus-editor">
    <!-- 顶部工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <button @click="returnToMain" class="return-btn">
          ← 返回
        </button>
      </div>
      <div class="toolbar-center">
        <button 
          @click="switchMode('entity')" 
          :class="{ active: currentMode === 'entity' }"
          class="mode-btn"
        >
          本体优化
        </button>
        <button 
          @click="switchMode('relation')" 
          :class="{ active: currentMode === 'relation' }"
          class="mode-btn"
        >
          关系优化
        </button>
        <button 
          @click="switchMode('overall')" 
          :class="{ active: currentMode === 'overall' }"
          class="mode-btn"
        >
          整体智能优化
        </button>
      </div>
      <div class="toolbar-right">
        <span class="subgraph-info">
          子图: {{ subgraphData.nodes.length }}个节点, {{ subgraphData.edges.length }}条边
        </span>
      </div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="editor-content">
      <!-- 左侧画布 -->
      <div class="canvas-area">
        <VueFlow
          v-model="subgraphElements"
          :node-types="nodeTypes"
          :edge-types="edgeTypes"
          class="subgraph-canvas"
        >
          <Background />
          <Controls />
        </VueFlow>
      </div>
      
      <!-- 右侧编辑面板 -->
      <div class="edit-panel" v-if="currentMode !== 'none'">
        <EntityOptimizationPanel 
          v-if="currentMode === 'entity'"
          :subgraph-data="subgraphData"
          @entity-optimized="handleEntityOptimized"
        />
        <RelationOptimizationPanel 
          v-if="currentMode === 'relation'"
          :subgraph-data="subgraphData"
          @relation-optimized="handleRelationOptimized"
        />
        <OverallOptimizationPanel 
          v-if="currentMode === 'overall'"
          :subgraph-data="subgraphData"
          :original-data="originalData"
          @overall-optimized="handleOverallOptimized"
        />
      </div>
    </div>
  </div>
</template>
```

### 2. 差异对比组件设计

```vue
<template>
  <div class="difference-viewer">
    <div class="diff-header">
      <h4>修改对比</h4>
      <div class="diff-actions">
        <button @click="acceptChanges" class="accept-btn">接受</button>
        <button @click="rejectChanges" class="reject-btn">放弃</button>
      </div>
    </div>
    
    <div class="diff-content">
      <div class="diff-section">
        <h5>修改前</h5>
        <div class="diff-before">
          <div v-for="field in changedFields" :key="field.name" class="field-item">
            <span class="field-name">{{ field.label }}:</span>
            <span class="field-value old">{{ field.before }}</span>
          </div>
        </div>
      </div>
      
      <div class="diff-section">
        <h5>修改后</h5>
        <div class="diff-after">
          <div v-for="field in changedFields" :key="field.name" class="field-item">
            <span class="field-name">{{ field.label }}:</span>
            <span class="field-value new">{{ field.after }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 3. 思考过程展示组件

```vue
<template>
  <div class="thinking-process">
    <div class="thinking-header">
      <h4>AI深度分析中...</h4>
      <div class="thinking-indicator">
        <div class="thinking-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
    
    <div class="thinking-steps">
      <div 
        v-for="(step, index) in thinkingSteps" 
        :key="index"
        class="thinking-step"
        :class="{ active: index === currentStep, completed: index < currentStep }"
      >
        <div class="step-number">{{ step.step }}</div>
        <div class="step-content">
          <h5>{{ step.title }}</h5>
          <p>{{ step.content }}</p>
          <ul v-if="step.findings && step.findings.length">
            <li v-for="finding in step.findings" :key="finding">
              {{ finding }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
```

## 数据流和状态管理

### 状态管理架构

```javascript
// 主状态管理
const useSubgraphEditor = () => {
  const state = reactive({
    // 编辑器状态
    isActive: false,
    currentMode: 'none',
    isProcessing: false,
    
    // 数据状态
    subgraphData: { nodes: [], edges: [] },
    originalData: { nodes: [], edges: [] },
    modifications: new Map(),
    
    // UI状态
    selectedEntity: null,
    selectedRelation: null,
    showDifference: false,
    thinkingProcess: []
  })
  
  // 编辑器控制
  const enterEditMode = (subgraph, originalData) => {
    state.subgraphData = deepClone(subgraph)
    state.originalData = originalData
    state.isActive = true
  }
  
  const exitEditMode = () => {
    // 数据融合逻辑
    const mergedData = mergeSubgraphChanges(
      state.originalData, 
      state.subgraphData, 
      state.modifications
    )
    
    state.isActive = false
    return mergedData
  }
  
  // 优化处理
  const processOptimization = async (type, target, userInput) => {
    state.isProcessing = true
    
    try {
      let result
      switch (type) {
        case 'entity':
          result = await EntityOptimizationService.optimizeEntity(target, userInput)
          break
        case 'relation':
          result = await RelationOptimizationService.optimizeRelation(target, userInput)
          break
        case 'overall':
          result = await OverallOptimizationService.optimizeOverall(
            state.subgraphData, 
            state.originalData
          )
          break
      }
      
      return result
    } finally {
      state.isProcessing = false
    }
  }
  
  return {
    state,
    enterEditMode,
    exitEditMode,
    processOptimization
  }
}
```

### 数据融合算法

```javascript
// 数据融合核心算法
function mergeSubgraphChanges(originalData, modifiedSubgraph, modifications) {
  const mergedData = deepClone(originalData)
  
  // 融合节点修改
  modifiedSubgraph.nodes.forEach(modifiedNode => {
    const originalIndex = mergedData.nodes.findIndex(n => n.id === modifiedNode.id)
    if (originalIndex !== -1) {
      // 保留位置信息，更新其他属性
      mergedData.nodes[originalIndex] = {
        ...modifiedNode,
        position: mergedData.nodes[originalIndex].position
      }
    }
  })
  
  // 融合边修改
  modifiedSubgraph.edges.forEach(modifiedEdge => {
    const originalIndex = mergedData.edges.findIndex(e => e.id === modifiedEdge.id)
    if (originalIndex !== -1) {
      mergedData.edges[originalIndex] = modifiedEdge
    }
  })
  
  return mergedData
}
```

## 错误处理和用户体验

### 错误处理策略

1. **网络错误处理**
   - 自动重试机制
   - 离线状态检测
   - 错误恢复建议

2. **数据验证**
   - 输入数据校验
   - AI响应格式验证
   - 数据完整性检查

3. **用户操作保护**
   - 未保存修改提醒
   - 操作确认对话框
   - 数据备份机制

### 性能优化

1. **数据处理优化**
   - 深拷贝优化
   - 差异计算优化
   - 内存使用监控

2. **UI渲染优化**
   - 虚拟滚动
   - 懒加载
   - 防抖处理

3. **AI请求优化**
   - 请求缓存
   - 并发控制
   - 超时处理

## 测试策略

### 单元测试

1. **数据处理测试**
   - 深拷贝功能测试
   - 数据融合算法测试
   - 差异计算测试

2. **AI服务测试**
   - Mock AI响应测试
   - 错误处理测试
   - 数据格式验证测试

### 集成测试

1. **用户流程测试**
   - 完整编辑流程测试
   - 数据同步测试
   - 错误恢复测试

2. **性能测试**
   - 大数据量处理测试
   - 内存使用测试
   - 响应时间测试

## 实现优先级

### 第一阶段：基础框架
1. SubgraphFocusEditor主组件
2. 基础UI布局和导航
3. 数据深拷贝和状态管理
4. 简单的编辑面板

### 第二阶段：核心功能
1. 本体优化面板和功能
2. 关系优化面板和功能
3. AI服务接口集成
4. 差异对比组件

### 第三阶段：高级功能
1. 整体智能优化
2. 思考过程展示
3. 数据融合和同步
4. 错误处理和用户体验优化

### 第四阶段：完善和优化
1. 性能优化
2. 测试覆盖
3. 文档完善
4. 用户反馈集成