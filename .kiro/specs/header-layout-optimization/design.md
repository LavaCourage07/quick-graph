# 正式图纸头部布局优化设计文档

## 概述

本设计文档描述了正式图纸页面头部布局的重构方案，旨在解决当前布局混乱的问题，提供清晰的双搜索功能和智能的操作按钮布局。

## 架构

### 整体布局结构

```
┌─────────────────────────────────────────────────────────────────┐
│                        头部工具栏                                │
├─────────────┬─────────────────────────────────┬─────────────────┤
│   左侧区域   │           中间搜索区域            │    右侧操作区域   │
│             │                                │                │
│  正式图纸    │  [节点搜索] [子图搜索] [清除]     │ [聚焦编辑] [概览] │
│             │                                │                │
└─────────────┴─────────────────────────────────┴─────────────────┘
```

### 组件层次结构

```
FinalCanvas
├── canvas-header
│   ├── header-left
│   │   └── title: "正式图纸"
│   ├── header-center
│   │   └── search-container
│   │       ├── node-search
│   │       │   ├── search-input (节点搜索)
│   │       │   └── search-results-indicator
│   │       ├── subgraph-search  
│   │       │   ├── search-input (子图搜索)
│   │       │   └── search-results-dropdown
│   │       └── clear-all-btn
│   └── header-right
│       └── action-buttons
│           ├── focus-edit-btn (条件显示)
│           │   └── tooltip (hover显示)
│           └── overview-btn (始终显示)
└── main-canvas-area
```

## 组件和接口

### 1. 头部容器组件 (canvas-header)

**职责：**
- 提供三栏布局结构
- 管理整体头部样式和响应式行为

**接口：**
```vue
<div class="canvas-header">
  <div class="header-left">...</div>
  <div class="header-center">...</div>
  <div class="header-right">...</div>
</div>
```

### 2. 搜索容器组件 (search-container)

**职责：**
- 管理双搜索框的布局和交互
- 处理搜索状态冲突
- 提供统一的清除功能

**状态管理：**
```javascript
const searchState = reactive({
  nodeSearch: {
    query: '',
    results: [],
    isActive: false
  },
  subgraphSearch: {
    query: '',
    results: [],
    selectedNode: null,
    isActive: false
  }
})
```

### 3. 节点搜索组件 (node-search)

**职责：**
- 实现原有的节点搜索和高亮功能
- 显示搜索结果数量提示
- 处理搜索输入和结果展示

**接口：**
```vue
<div class="node-search">
  <input 
    v-model="nodeSearchQuery"
    placeholder="搜索节点"
    @input="handleNodeSearch"
  />
  <div class="search-indicator" v-if="nodeSearchResults.length">
    找到 {{ nodeSearchResults.length }} 个节点
  </div>
</div>
```

### 4. 子图搜索组件 (subgraph-search)

**职责：**
- 实现子图搜索和节点选择功能
- 显示搜索结果下拉列表
- 处理节点选择和子图创建

**接口：**
```vue
<div class="subgraph-search">
  <input 
    v-model="subgraphSearchQuery"
    placeholder="搜索节点创建子图"
    @input="handleSubgraphSearch"
  />
  <div class="search-dropdown" v-if="subgraphSearchResults.length">
    <div 
      v-for="node in subgraphSearchResults"
      @click="selectNodeForSubgraph(node.id)"
    >
      {{ node.data.label }}
    </div>
  </div>
</div>
```

### 5. 操作按钮组件 (action-buttons)

**职责：**
- 根据当前状态显示相应按钮
- 处理按钮点击事件
- 显示子图信息提示

**条件渲染逻辑：**
```vue
<div class="action-buttons">
  <div 
    v-if="hasActiveSubgraph" 
    class="focus-edit-container"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <button @click="enterFocusEdit">聚焦编辑</button>
    <div v-if="showTooltip" class="tooltip">
      节点: {{ subgraph.nodes.length }}个
      关系: {{ subgraph.edges.length }}条
    </div>
  </div>
  <button @click="returnToOverview">回到整体概览</button>
</div>
```

## 数据模型

### 搜索状态模型

```javascript
interface SearchState {
  nodeSearch: {
    query: string
    results: Node[]
    isActive: boolean
    highlightTimeout: number | null
  }
  subgraphSearch: {
    query: string
    results: Node[]
    selectedNode: string | null
    isActive: boolean
    subgraph: {
      nodes: string[]
      edges: string[]
    }
  }
}
```

### 头部配置模型

```javascript
interface HeaderConfig {
  title: string
  showSearchContainer: boolean
  showActionButtons: boolean
  responsive: {
    breakpoints: {
      mobile: number
      tablet: number
      desktop: number
    }
  }
}
```

## 错误处理

### 搜索错误处理

1. **空搜索结果**
   - 显示"未找到匹配节点"提示
   - 提供搜索建议或重置选项

2. **搜索性能问题**
   - 实现防抖机制（300ms）
   - 大数据集时显示加载指示器

3. **状态冲突处理**
   - 新搜索自动清除旧搜索结果
   - 提供明确的状态切换反馈

### 按钮操作错误处理

1. **聚焦编辑失败**
   - 检查子图状态有效性
   - 显示错误提示并提供重试选项

2. **概览功能失败**
   - 捕获fitView异常
   - 提供手动重置选项

## 测试策略

### 单元测试

1. **搜索功能测试**
   - 测试节点搜索匹配逻辑
   - 测试子图搜索结果生成
   - 测试搜索状态管理

2. **按钮状态测试**
   - 测试按钮显示条件
   - 测试按钮点击处理
   - 测试提示框显示逻辑

### 集成测试

1. **用户交互流程测试**
   - 测试完整的搜索→选择→高亮流程
   - 测试搜索功能切换
   - 测试按钮操作流程

2. **响应式布局测试**
   - 测试不同屏幕尺寸下的布局
   - 测试内容溢出处理
   - 测试交互可用性

### 性能测试

1. **搜索性能测试**
   - 测试大数据集搜索响应时间
   - 测试防抖机制效果
   - 测试内存使用情况

2. **渲染性能测试**
   - 测试头部组件渲染时间
   - 测试状态更新性能
   - 测试动画流畅度

## 实现优先级

### 高优先级
1. 基础三栏布局结构
2. 双搜索框功能实现
3. 按钮状态管理

### 中优先级
1. 搜索结果展示优化
2. 提示框和反馈机制
3. 响应式布局适配

### 低优先级
1. 高级动画效果
2. 性能优化细节
3. 辅助功能支持