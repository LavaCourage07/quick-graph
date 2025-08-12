<template>
  <div class="app">
    <!-- 左侧步骤栏 -->
    <div class="sidebar">
      <div class="step-item" :class="getStepClass(0)" @click="goToStep(0)">
        <span class="step-number">1</span>
        文本识别
      </div>
      <div class="step-item" :class="getStepClass(1)" @click="goToStep(1)">
        <span class="step-number">2</span>
        草图概览
      </div>
      <div class="step-item" :class="getStepClass(2)" @click="goToStep(2)">
        <span class="step-number">3</span>
        正式图纸
      </div>
    </div>

    <!-- 右侧主内容区 -->
    <div class="main-content">
      <div class="canvas-container">
        <!-- 第一步：文本识别 -->
        <TextRecognition
          v-if="currentStep === 0"
          v-model="inputText"
          :mermaid-result="mermaidCode"
          ref="textRecognitionRef"
        />

        <!-- 第二步：草图概览 -->
        <SketchCanvas
          v-if="currentStep === 1"
          v-model="sketchData"
          @elements-changed="onSketchDataChanged"
          ref="sketchCanvasRef"
        />

        <!-- 第三步：正式图纸 -->
        <FinalCanvas
          v-if="currentStep === 2 && !showSubgraphEditor"
          v-model="finalData"
          @enter-focus-edit="handleEnterFocusEdit"
          ref="finalCanvasRef"
        />

        <!-- 子图聚焦编辑页面 -->
        <SubgraphFocusEditor
          v-if="showSubgraphEditor"
          :subgraph-data="subgraphEditData.subgraphData"
          :original-data="subgraphEditData.originalData"
          @return-to-main="handleReturnFromSubgraph"
          @data-changed="handleSubgraphDataChanged"
        />
      </div>

      <!-- 底部操作栏 -->
      <div class="action-bar">
        <button
          class="btn btn-secondary"
          :disabled="currentStep === 0"
          @click="previousStep"
        >
          上一步
        </button>

        <!-- 第一步特殊按钮 -->
        <button
          v-if="currentStep === 0"
          class="btn btn-primary"
          :disabled="!inputText.trim() || isLoading"
          @click="generateSketch"
        >
          <span v-if="isLoading" class="spinner"></span>
          智能生成草图
        </button>

        <!-- 第二步特殊按钮 -->
        <button
          v-if="currentStep === 1"
          class="btn btn-primary"
          :disabled="!sketchData.nodes.length || isLoading"
          @click="generateFinal"
        >
          <span v-if="isLoading" class="spinner"></span>
          智能创建正式图
        </button>

        <button
          class="btn btn-secondary"
          :disabled="currentStep === 2"
          @click="nextStep"
        >
          下一步
        </button>

        <!-- 其他功能按钮 -->
        <button
          v-if="currentStep === 1"
          class="btn btn-secondary"
          @click="exportSketch"
        >
          导出草图
        </button>

        <button
          v-if="currentStep === 1"
          class="btn btn-secondary"
          @click="debugSketchData"
        >
          调试数据
        </button>

        <button
          v-if="currentStep === 2"
          class="btn btn-secondary"
          @click="exportFinal"
        >
          导出正式图
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import TextRecognition from "./components/TextRecognition.vue";
import SketchCanvas from "./components/SketchCanvas.vue";
import FinalCanvas from "./components/FinalCanvas.vue";
import SubgraphFocusEditor from "./components/SubgraphFocusEditor.vue";
import { kimiAPI } from "./api/kimi.js";

// 状态管理
const currentStep = ref(0);
const isLoading = ref(false);
const inputText = ref("");
const mermaidCode = ref("");
const sketchData = reactive({ nodes: [], edges: [] });
const finalData = reactive({ nodes: [], edges: [] });

// 子图编辑页面状态
const showSubgraphEditor = ref(false);
const subgraphEditData = reactive({
  subgraphData: { nodes: [], edges: [] },
  originalData: { nodes: [], edges: [] },
  savedHighlightState: null
});

// 监听sketchData的变化
watch(sketchData, (newValue) => {
  console.log('App.vue sketchData变化:', {
    nodes: newValue.nodes.length,
    edges: newValue.edges.length,
    nodeIds: newValue.nodes.map(n => n.id),
    edgeIds: newValue.edges.map(e => e.id)
  })
}, { deep: true })

// 组件引用
const textRecognitionRef = ref(null);
const sketchCanvasRef = ref(null);
const finalCanvasRef = ref(null);

// 获取步骤样式类
const getStepClass = (step) => {
  if (step === currentStep.value) return "active";
  if (step < currentStep.value) return "completed";
  return "";
};

// 跳转到指定步骤
const goToStep = (step) => {
  if (step <= currentStep.value || step === currentStep.value + 1) {
    currentStep.value = step;
  }
};

// 上一步
const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

// 下一步
const nextStep = () => {
  if (currentStep.value < 2) {
    currentStep.value++;
  }
};

// 生成草图
const generateSketch = async () => {
  if (!inputText.value.trim()) return;

  isLoading.value = true;
  if (textRecognitionRef.value) {
    textRecognitionRef.value.setLoading(true);
  }

  try {
    const result = await kimiAPI.recognizeText(inputText.value);

    console.log("API返回结果:", result);

    // 保存原始Mermaid代码
    mermaidCode.value = result.mermaidCode;

    // 设置草图数据
    sketchData.nodes.splice(0, sketchData.nodes.length, ...result.nodes);
    sketchData.edges.splice(0, sketchData.edges.length, ...result.edges);

    console.log("设置草图数据:", {
      nodes: sketchData.nodes.length,
      edges: sketchData.edges.length,
    });

    // 自动跳转到草图概览
    currentStep.value = 1;
  } catch (error) {
    console.error("生成草图失败:", error);
    alert("生成草图失败，请重试");
  } finally {
    isLoading.value = false;
    if (textRecognitionRef.value) {
      textRecognitionRef.value.setLoading(false);
    }
  }
};

// 生成正式图
const generateFinal = async () => {
  console.log('=== 开始生成正式图 ===')
  console.log('当前sketchData状态:', {
    nodes: sketchData.nodes.length,
    edges: sketchData.edges.length,
    nodeDetails: sketchData.nodes.map(n => ({ 
      id: n.id, 
      label: n.data?.label || 'NO_LABEL',
      type: n.type 
    })),
    edgeDetails: sketchData.edges.map(e => ({ 
      id: e.id, 
      label: e.label || 'NO_LABEL',
      source: e.source,
      target: e.target
    }))
  })
  
  if (!sketchData.nodes.length) {
    console.error('没有节点数据，无法生成正式图')
    return;
  }

  isLoading.value = true;

  try {
    console.log('开始生成正式图，调用大模型增强...')
    console.log('草图数据详情:', { 
      nodes: sketchData.nodes.length, 
      edges: sketchData.edges.length,
      allNodes: sketchData.nodes.map(n => ({ id: n.id, label: n.data.label })),
      allEdges: sketchData.edges.map(e => ({ id: e.id, label: e.label, source: e.source, target: e.target }))
    })
    
    // 验证草图数据的完整性
    if (!sketchData.nodes.length) {
      throw new Error('草图中没有节点数据')
    }
    
    console.log('草图数据验证通过，开始调用大模型...')
    
    // 调用大模型批量增强节点和边信息
    const enhancedData = await kimiAPI.batchEnhanceGraph(sketchData.nodes, sketchData.edges)
    console.log('大模型增强结果:', enhancedData)
    
    // 验证增强数据的结构
    if (!enhancedData || !enhancedData.nodes || !enhancedData.edges) {
      console.error('增强数据结构不正确:', enhancedData)
      throw new Error('大模型返回的数据格式不正确')
    }
    
    // 复制草图数据到正式图，并将节点类型改为rect，同时添加增强信息
    finalData.nodes = JSON.parse(JSON.stringify(sketchData.nodes)).map(node => {
      const enhanced = enhancedData.nodes.find(n => n.id === node.id)
      return {
        ...node,
        type: 'rect', // 正式图使用长方形节点
        data: {
          ...node.data,
          // 添加增强信息
          englishName: enhanced?.englishName || '',
          description: enhanced?.description || '',
          parameters: enhanced?.parameters || [],
          features: enhanced?.features || []
        }
      }
    })
    
    // 复制边数据并添加增强信息
    finalData.edges = JSON.parse(JSON.stringify(sketchData.edges)).map(edge => {
      const enhanced = enhancedData.edges.find(e => e.id === edge.id)
      return {
        ...edge,
        data: {
          label: edge.label,
          englishName: enhanced?.englishName || '',
          description: enhanced?.description || '',
          parameters: enhanced?.parameters || [],
          features: enhanced?.features || []
        }
      }
    })
    
    // 为正式图重新计算布局（适应长方形节点）
    optimizeLayoutForRect(finalData.nodes)
    
    // 重新分配连接桩（根据新的布局和节点大小）
    kimiAPI.assignHandlesToEdges(finalData.nodes, finalData.edges)
    
    console.log('正式图生成完成')
    
    // 自动跳转到正式图纸
    currentStep.value = 2
  } catch (error) {
    console.error('生成正式图失败:', error)
    console.error('错误详情:', error.stack)
    
    // 如果大模型调用失败，至少要生成基本的正式图
    console.log('大模型调用失败，生成基本正式图...')
    try {
      // 复制草图数据到正式图，不包含增强信息
      finalData.nodes = JSON.parse(JSON.stringify(sketchData.nodes)).map(node => ({
        ...node,
        type: 'rect',
        data: {
          ...node.data,
          englishName: '',
          description: '信息增强失败，请手动完善',
          parameters: [],
          features: []
        }
      }))
      
      finalData.edges = JSON.parse(JSON.stringify(sketchData.edges)).map(edge => ({
        ...edge,
        data: {
          label: edge.label,
          englishName: '',
          description: '信息增强失败，请手动完善',
          parameters: [],
          features: []
        }
      }))
      
      // 为正式图重新计算布局
      optimizeLayoutForRect(finalData.nodes)
      
      // 重新分配连接桩
      kimiAPI.assignHandlesToEdges(finalData.nodes, finalData.edges)
      
      // 跳转到正式图
      currentStep.value = 2
      
      alert('大模型增强失败，已生成基本正式图。错误：' + error.message)
    } catch (fallbackError) {
      console.error('生成基本正式图也失败:', fallbackError)
      alert('生成正式图完全失败：' + fallbackError.message)
    }
  } finally {
    isLoading.value = false;
  }
};

// 优化布局
const optimizeLayout = (nodes) => {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);
  const spacing = 200;

  nodes.forEach((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    node.position = {
      x: col * spacing + 100,
      y: row * spacing + 100,
    };
  });
};

// 为长方形节点优化布局
const optimizeLayoutForRect = (nodes) => {
  if (nodes.length === 0) return;

  // 长方形节点需要更大的间距
  const nodeWidth = 220; // 长方形节点宽度
  const nodeHeight = 60; // 长方形节点高度
  const horizontalSpacing = nodeWidth + 80; // 水平间距
  const verticalSpacing = nodeHeight + 100; // 垂直间距
  
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);

  nodes.forEach((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    node.position = {
      x: col * horizontalSpacing + 150,
      y: row * verticalSpacing + 150,
    };
  });
};

// 导出草图
const exportSketch = () => {
  const data = {
    type: "sketch",
    data: sketchData,
    timestamp: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sketch-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// 导出正式图
const exportFinal = () => {
  const data = {
    type: "final",
    data: finalData,
    timestamp: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `final-graph-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// 处理SketchCanvas数据变化
const onSketchDataChanged = (newData) => {
  console.log('App.vue 接收到SketchCanvas数据变化:', {
    nodes: newData.nodes.length,
    edges: newData.edges.length,
    nodeDetails: newData.nodes.map(n => ({ id: n.id, label: n.data?.label })),
    edgeDetails: newData.edges.map(e => ({ id: e.id, label: e.label }))
  })
  
  // 强制更新sketchData
  sketchData.nodes.splice(0, sketchData.nodes.length, ...newData.nodes)
  sketchData.edges.splice(0, sketchData.edges.length, ...newData.edges)
  
  console.log('App.vue sketchData已强制更新:', {
    nodes: sketchData.nodes.length,
    edges: sketchData.edges.length
  })
}

// 调试草图数据
const debugSketchData = () => {
  console.log('=== 调试草图数据 ===')
  console.log('sketchData.nodes:', sketchData.nodes)
  console.log('sketchData.edges:', sketchData.edges)
  
  alert(`当前草图数据：
节点数量: ${sketchData.nodes.length}
边数量: ${sketchData.edges.length}

节点详情:
${sketchData.nodes.map(n => `- ${n.id}: ${n.data?.label || 'NO_LABEL'}`).join('\n')}

边详情:
${sketchData.edges.map(e => `- ${e.id}: ${e.label || 'NO_LABEL'} (${e.source} -> ${e.target})`).join('\n')}

详细信息请查看控制台`)
};

// 处理进入子图聚焦编辑
const handleEnterFocusEdit = (data) => {
  console.log('进入子图聚焦编辑模式:', data);
  
  // 设置子图编辑数据
  subgraphEditData.subgraphData = data.subgraphData;
  subgraphEditData.originalData = data.originalData;
  subgraphEditData.savedHighlightState = data.savedHighlightState; // 保存高亮状态
  
  // 显示子图编辑页面
  showSubgraphEditor.value = true;
  
  console.log('子图编辑页面已激活:', {
    subgraphNodes: data.subgraphData.nodes.length,
    subgraphEdges: data.subgraphData.edges.length
  });
};

// 处理从子图编辑返回
const handleReturnFromSubgraph = () => {
  console.log('从子图编辑返回到整体图纸');
  
  // 隐藏子图编辑页面
  showSubgraphEditor.value = false;
  
  // 恢复高亮状态（如果有保存的状态）
  if (subgraphEditData.savedHighlightState) {
    // 通过ref调用FinalCanvas的恢复高亮方法
    if (finalCanvasRef.value && finalCanvasRef.value.restoreHighlight) {
      finalCanvasRef.value.restoreHighlight(subgraphEditData.savedHighlightState);
    }
  }
  
  // 清空子图编辑数据
  subgraphEditData.subgraphData = { nodes: [], edges: [] };
  subgraphEditData.originalData = { nodes: [], edges: [] };
  subgraphEditData.savedHighlightState = null;
  
  console.log('已返回到整体图纸页面');
};

// 处理子图数据变更
const handleSubgraphDataChanged = (modifiedData) => {
  console.log('子图数据已修改:', modifiedData);
  
  // 这里应该实现数据融合逻辑，将修改后的子图数据合并到完整图表中
  if (modifiedData && modifiedData.nodes && modifiedData.edges) {
    // TODO: 实现数据融合算法
    // 暂时直接更新finalData（后续任务中会完善这个逻辑）
    console.log('应用子图修改到完整图表');
    
    // 简单的数据更新逻辑（后续会被更完善的融合算法替代）
    const modifiedNodeIds = modifiedData.nodes.map(n => n.id);
    const modifiedEdgeIds = modifiedData.edges.map(e => e.id);
    
    // 更新修改过的节点
    finalData.nodes.forEach((node, index) => {
      const modifiedNode = modifiedData.nodes.find(n => n.id === node.id);
      if (modifiedNode) {
        finalData.nodes[index] = { ...modifiedNode };
      }
    });
    
    // 更新修改过的边
    finalData.edges.forEach((edge, index) => {
      const modifiedEdge = modifiedData.edges.find(e => e.id === edge.id);
      if (modifiedEdge) {
        finalData.edges[index] = { ...modifiedEdge };
      }
    });
    
    console.log('子图修改已应用到完整图表');
  }
  
  // 返回到整体图纸页面
  handleReturnFromSubgraph();
};
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  background-color: #f8f9fa;
  border-right: 1px solid #e9ecef;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.canvas-container {
  flex: 1;
  position: relative;
}

.action-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e9ecef;
  padding: 15px 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
  z-index: 100;
}

.step-item {
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.step-item.active {
  background-color: #4068d4;
  color: white;
}

.step-item.completed {
  background-color: #e8f4fd;
  border-color: #4068d4;
  color: #4068d4;
}

.step-item:hover:not(.active) {
  background-color: #f0f0f0;
}

.step-number {
  font-weight: bold;
  margin-right: 10px;
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
