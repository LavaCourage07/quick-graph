# 子图高亮功能设计文档

## 概述

本设计文档描述了在智能图表生成器的正式图纸阶段（FinalCanvas.vue）中实现子图高亮功能的技术方案。该功能将在现有节点搜索功能的基础上，添加一个独立的子图搜索和高亮系统，允许用户选择特定节点并高亮显示其直接关联的子图。

## 架构设计

### 整体架构

```
FinalCanvas.vue
├── 搜索系统
│   ├── 原有节点搜索 (保持不变)
│   └── 新增子图搜索
├── 高亮系统
│   ├── 节点高亮 (现有功能)
│   └── 子图高亮 (新功能)
├── 视图控制系统
│   ├── 节点居中 (现有功能)
│   └── 整体概览 (新功能)
└── 状态管理
    ├── 搜索状态
    ├── 高亮状态
    └── 视图状态
```

### 核心组件设计

#### 1. 搜索界面组件

**双搜索框布局：**
- 垂直排列两个独立的搜索框
- 第一个：原有的节点搜索功能
- 第二个：新的子图搜索功能
- 每个搜索框都有独立的结果显示区域

#### 2. 子图计算引擎

**图关系分析算法：**
```javascript
// 子图计算核心算法
function calculateSubgraph(selectedNodeId, nodes, edges) {
  const subgraphNodes = new Set([selectedNodeId])
  const subgraphEdges = new Set()
  
  // 找到所有与选中节点直接相连的边
  edges.forEach(edge => {
    if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
      subgraphEdges.add(edge.id)
      // 添加连接的另一端节点
      const connectedNodeId = edge.source === selectedNodeId ? edge.target : edge.source
      subgraphNodes.add(connectedNodeId)
    }
  })
  
  return {
    nodes: Array.from(subgraphNodes),
    edges: Array.from(subgraphEdges)
  }
}
```

#### 3. 高亮渲染系统

**多层高亮效果：**
- **子图高亮层：** 选中的子图元素使用强高亮效果
- **背景淡化层：** 非子图元素降低透明度
- **状态指示层：** 显示子图统计信息

## 组件和接口设计

### 数据模型

#### 子图搜索状态
```javascript
const subgraphSearchState = {
  query: '',                    // 搜索关键词
  results: [],                  // 搜索结果节点列表
  selectedNode: null,           // 选中的节点
  isActive: false,              // 子图高亮是否激活
  subgraph: {                   // 计算出的子图
    nodes: [],                  // 子图节点ID列表
    edges: []                   // 子图边ID列表
  },
  statistics: {                 // 子图统计信息
    nodeCount: 0,
    edgeCount: 0
  }
}
```

#### 高亮状态管理
```javascript
const highlightState = {
  mode: 'none',                 // 'none' | 'node' | 'subgraph'
  nodeHighlight: {              // 原有节点高亮
    nodes: [],
    timeout: null
  },
  subgraphHighlight: {          // 子图高亮
    nodes: [],
    edges: [],
    centerNode: null
  }
}
```

### 核心接口设计

#### 1. 子图搜索接口
```javascript
// 子图搜索
function performSubgraphSearch(query) {
  const matchedNodes = nodes.value.filter(node => 
    node.data.label?.toLowerCase().includes(query.toLowerCase())
  )
  return matchedNodes
}

// 选择节点创建子图
function selectNodeForSubgraph(nodeId) {
  const subgraph = calculateSubgraph(nodeId, nodes.value, edges.value)
  activateSubgraphHighlight(subgraph, nodeId)
}
```

#### 2. 高亮控制接口
```javascript
// 激活子图高亮
function activateSubgraphHighlight(subgraph, centerNodeId) {
  // 清除其他高亮状态
  clearAllHighlights()
  
  // 设置子图高亮
  applySubgraphHighlight(subgraph)
  
  // 更新状态
  updateSubgraphState(subgraph, centerNodeId)
}

// 应用子图高亮效果
function applySubgraphHighlight(subgraph) {
  elements.value.forEach(element => {
    if (!element.source && !element.target) {
      // 节点处理
      element.data.subgraphHighlighted = subgraph.nodes.includes(element.id)
      element.data.dimmed = !subgraph.nodes.includes(element.id)
    } else {
      // 边处理
      element.subgraphHighlighted = subgraph.edges.includes(element.id)
      element.dimmed = !subgraph.edges.includes(element.id)
    }
  })
}
```

#### 3. 视图控制接口
```javascript
// 整体概览
function returnToOverview() {
  // 清除所有高亮
  clearAllHighlights()
  
  // 适应画布居中
  if (vueFlowInstance.value) {
    vueFlowInstance.value.fitView({
      padding: 0.1,
      duration: 800,
      maxZoom: 1.5,
      minZoom: 0.3
    })
  }
  
  // 重置搜索状态
  resetSearchStates()
}
```

## 数据模型

### 节点数据扩展
```javascript
// 现有节点数据结构扩展
const nodeData = {
  // 现有属性
  label: string,
  highlighted: boolean,        // 原有节点高亮
  
  // 新增属性
  subgraphHighlighted: boolean, // 子图高亮状态
  dimmed: boolean,             // 是否被淡化显示
  isSubgraphCenter: boolean    // 是否为子图中心节点
}
```

### 边数据扩展
```javascript
// 边数据结构扩展
const edgeData = {
  // 现有属性
  id: string,
  source: string,
  target: string,
  label: string,
  
  // 新增属性
  subgraphHighlighted: boolean, // 子图高亮状态
  dimmed: boolean              // 是否被淡化显示
}
```

## 错误处理

### 异常情况处理

1. **空图表处理**
   - 当图表中没有节点时，禁用子图搜索功能
   - 显示适当的提示信息

2. **搜索无结果处理**
   - 显示"未找到匹配节点"提示
   - 保持当前高亮状态不变

3. **孤立节点处理**
   - 当选中的节点没有任何连接时，只高亮该节点本身
   - 显示"该节点为孤立节点"的提示信息

4. **性能优化处理**
   - 当子图包含超过50个元素时，显示性能警告
   - 提供分批渲染机制避免界面卡顿

### 状态冲突处理

1. **搜索功能冲突**
   - 当激活子图搜索时，自动清除原有节点搜索的高亮
   - 当使用原有节点搜索时，自动清除子图高亮状态

2. **用户操作冲突**
   - 在子图高亮状态下，用户拖拽节点不会影响高亮状态
   - 用户删除节点时，自动更新子图高亮状态

## 测试策略

### 单元测试

1. **子图计算算法测试**
   - 测试单节点子图计算
   - 测试多连接节点子图计算
   - 测试孤立节点处理
   - 测试循环连接处理

2. **高亮状态管理测试**
   - 测试高亮状态切换
   - 测试状态冲突处理
   - 测试状态重置功能

3. **搜索功能测试**
   - 测试模糊搜索匹配
   - 测试空搜索处理
   - 测试特殊字符搜索

### 集成测试

1. **用户交互流程测试**
   - 完整的子图搜索→选择→高亮→概览流程
   - 多次切换不同子图的流程
   - 与原有功能的兼容性测试

2. **性能测试**
   - 大图表（100+节点）的子图计算性能
   - 高亮渲染性能测试
   - 内存使用情况测试

### 用户体验测试

1. **响应时间测试**
   - 搜索响应时间 < 500ms
   - 高亮切换时间 < 200ms
   - 视图切换动画流畅度

2. **视觉效果测试**
   - 高亮效果清晰度
   - 淡化效果适中性
   - 动画过渡自然性

## 实现优先级

### 第一阶段：核心功能
1. 子图搜索界面实现
2. 子图计算算法实现
3. 基础高亮效果实现
4. 整体概览功能实现

### 第二阶段：用户体验优化
1. 搜索结果优化显示
2. 高亮效果动画优化
3. 状态统计信息显示
4. 错误处理和提示优化

### 第三阶段：性能和稳定性
1. 大图表性能优化
2. 内存使用优化
3. 边界情况处理完善
4. 全面测试和调试

## 技术依赖

### 现有依赖
- Vue 3 Composition API
- VueFlow 图表框架
- 现有的节点和边组件

### 新增依赖
- 无需新增外部依赖
- 复用现有的高亮和动画系统
- 扩展现有的状态管理机制

## 兼容性考虑

### 向后兼容
- 保持现有节点搜索功能完全不变
- 保持现有API接口不变
- 保持现有数据结构兼容

### 扩展性设计
- 预留多级子图扩展接口
- 预留自定义高亮样式接口
- 预留子图过滤条件扩展接口