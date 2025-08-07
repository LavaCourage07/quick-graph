import axios from 'axios'

const KIMI_API_KEY = 'sk-7NRPjLXjrQkIrgKsXu1pKJGydDtSC8iY6EtghcppOFw5iQkw'
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions'

const kimiClient = axios.create({
  baseURL: KIMI_API_URL,
  headers: {
    'Authorization': `Bearer ${KIMI_API_KEY}`,
    'Content-Type': 'application/json'
  }
})

// 文本识别提示词
const TEXT_RECOGNITION_PROMPT = `你是一名工业知识建模助手。  
任务：  
1. 从用户提供的中文或英文业务描述中，**识别唯一实体**（设备、物料、地点等），为每个实体生成 **唯一 ID**（英数字母或下划线，禁止空格、全中文）。  
2. 识别实体之间的 **显式或隐含关系**。关系名称必须使用 **中文动词/动宾短语**；若原文无中文，可采用「中文+英文」组合，如"加热 heats"。  
3. 根据识别结果输出 **Mermaid flowchart**，格式必须如下：  

\`\`\`mermaid
graph TD
  ID1["节点标签1"] -- 关系名称 --> ID2["节点标签2"]
  ID3["节点标签3"] --- ID4["节点标签4"]  %% 无向连线示例
\`\`\`

4. **输出规范**  
   • 只输出 **一段** 被 \`\`\`mermaid\`\`\` 包裹的代码块，禁止任何额外文字。  
   • 节点标签优先使用中文；若无对应中文，可中英结合（例如"锅炉 Boiler"）。  
   • 关系名称必须中文；如确无对应中文，使用「中文+英文」组合。  
   • 如果无法确定关系方向，请使用 **无向连线** \`---\`（三个连字符，无箭头）。  
   • 同一实体出现多次须合并为同一节点。  
   • 不要生成孤立节点（至少一条边）。  
   • 不要臆造文本中不存在的信息。

请分析以下文本：`

// 节点和边信息完善提示词
const ENHANCEMENT_PROMPT = `你是一名工业知识建模专家。请对以下节点/边进行详细的信息补充和完善：

节点/边信息：{item}

请提供以下信息：
1. 详细描述
2. 技术参数（如适用）
3. 功能特点
4. 相关注意事项

请用中文回答，格式简洁明了。`

// 批量增强提示词
const BATCH_ENHANCEMENT_PROMPT = `你是一名工业知识建模专家。请对以下图表中的所有节点和边进行详细的信息补充和完善。

图表数据：
节点列表：{nodes}
边列表：{edges}

请为每个节点和边提供以下信息，并以JSON格式返回：
1. 中文名称（保持原有）
2. 英文名称
3. 详细描述
4. 属性列表（每个属性包含中文名称、英文名称、类型）

属性类型说明：
- String：字符串类型
- Number：数值型
- Enum：枚举型

返回格式示例：
{
  "nodes": [
    {
      "id": "节点ID",
      "chineseName": "中文名称",
      "englishName": "English Name",
      "description": "详细描述",
      "attributes": [
        {
          "chineseName": "温度",
          "englishName": "temperature",
          "type": "Number"
        },
        {
          "chineseName": "状态",
          "englishName": "status",
          "type": "Enum"
        }
      ]
    }
  ],
  "edges": [
    {
      "id": "边ID",
      "chineseName": "中文名称",
      "englishName": "English Name", 
      "description": "详细描述",
      "attributes": [
        {
          "chineseName": "流量",
          "englishName": "flowRate",
          "type": "Number"
        }
      ]
    }
  ]
}

请确保返回的是有效的JSON格式，不要包含任何其他文字。`

// 智能修改图纸提示词
const SMART_EDIT_PROMPT = `你是一名图纸编辑专家。请根据用户的自然语言指令，对现有图纸进行智能修改。

当前图纸状态：
节点列表：{nodes}
边列表：{edges}

用户指令：{instruction}

请分析用户指令并执行相应的修改操作：

1. **新增节点**：如果用户要求添加新节点，请创建新的节点对象
2. **删除节点**：如果用户要求删除节点，请移除对应节点及其相关的边
3. **修改节点**：如果用户要求修改节点名称或属性，请更新对应节点
4. **新增边**：如果用户要求添加节点间的关系，请创建新的边对象
5. **删除边**：如果用户要求删除关系，请移除对应的边
6. **修改边**：如果用户要求修改关系名称，请更新对应边的标签

**重要规则**：
- 节点ID必须唯一，使用英文字母、数字或下划线
- 如果指令中提到的节点不存在，请使用模糊匹配查找相似节点
- 如果无法理解指令或找不到对应节点，请保持原图纸不变
- 新增的节点位置应该合理分布，避免重叠
- 保持图纸的逻辑性和连贯性

请返回修改后的完整图纸数据，格式如下：
{
  "success": true/false,
  "message": "操作说明",
  "nodes": [修改后的节点数组],
  "edges": [修改后的边数组]
}

请确保返回的是有效的JSON格式，不要包含任何其他文字。`

export const kimiAPI = {
  // 文本识别
  async recognizeText(text) {
    try {
      const response = await kimiClient.post('', {
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: TEXT_RECOGNITION_PROMPT
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })

      const mermaidCode = response.data.choices[0].message.content
      const parsedData = this.parseMermaidToJSON(mermaidCode)

      // 返回包含原始Mermaid代码和解析数据的对象
      return {
        mermaidCode: mermaidCode,
        nodes: parsedData.nodes,
        edges: parsedData.edges
      }
    } catch (error) {
      console.error('文本识别失败:', error)
      throw new Error('文本识别失败，请重试')
    }
  },

  // 完善节点/边信息
  async enhanceItem(item) {
    try {
      const response = await kimiClient.post('', {
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: ENHANCEMENT_PROMPT.replace('{item}', JSON.stringify(item, null, 2))
          },
          {
            role: 'user',
            content: '请完善这个节点/边的信息'
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })

      return response.data.choices[0].message.content
    } catch (error) {
      console.error('信息完善失败:', error)
      return '信息完善失败，请重试'
    }
  },

  // 批量增强节点和边信息
  async batchEnhanceGraph(nodes, edges) {
    try {
      // 准备节点和边的简化数据
      const nodeData = nodes.map(node => ({
        id: node.id,
        label: node.data.label
      }))

      const edgeData = edges.map(edge => ({
        id: edge.id,
        label: edge.label,
        source: edge.source,
        target: edge.target
      }))

      const prompt = BATCH_ENHANCEMENT_PROMPT
        .replace('{nodes}', JSON.stringify(nodeData, null, 2))
        .replace('{edges}', JSON.stringify(edgeData, null, 2))

      const response = await kimiClient.post('', {
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: '请批量完善所有节点和边的信息'
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      })

      const result = response.data.choices[0].message.content

      // 尝试解析JSON结果
      try {
        const enhancedData = JSON.parse(result)
        return enhancedData
      } catch (parseError) {
        console.error('JSON解析失败:', parseError)
        // 如果JSON解析失败，尝试提取JSON部分
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
        throw new Error('无法解析增强结果')
      }
    } catch (error) {
      console.error('批量增强失败:', error)
      throw new Error('批量增强失败，请重试')
    }
  },

  // 智能修改图纸
  async smartEditGraph(nodes, edges, instruction) {
    try {
      console.log('开始智能修改图纸:', { nodes: nodes.length, edges: edges.length, instruction })

      // 准备当前图纸数据
      const nodeData = nodes.map(node => ({
        id: node.id,
        label: node.data?.label || '未命名',
        position: node.position,
        type: node.type
      }))

      const edgeData = edges.map(edge => ({
        id: edge.id,
        label: edge.label || '关系',
        source: edge.source,
        target: edge.target,
        type: edge.type
      }))

      const prompt = SMART_EDIT_PROMPT
        .replace('{nodes}', JSON.stringify(nodeData, null, 2))
        .replace('{edges}', JSON.stringify(edgeData, null, 2))
        .replace('{instruction}', instruction)

      const response = await kimiClient.post('', {
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: '请根据指令修改图纸'
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })

      const result = response.data.choices[0].message.content
      console.log('大模型返回结果:', result)

      // 尝试解析JSON结果
      try {
        const modifiedData = JSON.parse(result)
        
        if (!modifiedData.success) {
          console.log('修改失败:', modifiedData.message)
          return {
            success: false,
            message: modifiedData.message || '无法理解指令或找不到对应节点',
            nodes: nodes,
            edges: edges
          }
        }

        // 处理修改后的节点数据
        const processedNodes = modifiedData.nodes.map(node => ({
          id: node.id,
          data: { label: node.label || node.data?.label || '未命名' },
          position: node.position || this.generateRandomPosition(),
          type: node.type || 'custom'
        }))

        // 处理修改后的边数据
        const processedEdges = modifiedData.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label || '关系',
          type: edge.type || 'bezier'
        }))

        // 只为没有位置的节点分配位置，保留大模型返回的精确位置
        processedNodes.forEach(node => {
          if (!node.position || (node.position.x === 0 && node.position.y === 0)) {
            node.position = this.generateRandomPosition()
          }
        })
        
        // 重新分配连接桩
        this.assignHandlesToEdges(processedNodes, processedEdges)

        console.log('图纸修改成功:', {
          originalNodes: nodes.length,
          originalEdges: edges.length,
          newNodes: processedNodes.length,
          newEdges: processedEdges.length
        })

        return {
          success: true,
          message: modifiedData.message || '图纸修改成功',
          nodes: processedNodes,
          edges: processedEdges
        }

      } catch (parseError) {
        console.error('JSON解析失败:', parseError)
        // 如果JSON解析失败，尝试提取JSON部分
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const modifiedData = JSON.parse(jsonMatch[0])
            // 重复上面的处理逻辑
            if (!modifiedData.success) {
              return {
                success: false,
                message: modifiedData.message || '无法理解指令',
                nodes: nodes,
                edges: edges
              }
            }

            const processedNodes = modifiedData.nodes.map(node => ({
              id: node.id,
              data: { label: node.label || node.data?.label || '未命名' },
              position: node.position || this.generateRandomPosition(),
              type: node.type || 'custom'
            }))

            const processedEdges = modifiedData.edges.map(edge => ({
              id: edge.id,
              source: edge.source,
              target: edge.target,
              label: edge.label || '关系',
              type: edge.type || 'bezier'
            }))

            // 只为没有位置的节点分配位置，保留大模型返回的精确位置
            processedNodes.forEach(node => {
              if (!node.position || (node.position.x === 0 && node.position.y === 0)) {
                node.position = this.generateRandomPosition()
              }
            })
            
            // 重新分配连接桩
            this.assignHandlesToEdges(processedNodes, processedEdges)

            return {
              success: true,
              message: modifiedData.message || '图纸修改成功',
              nodes: processedNodes,
              edges: processedEdges
            }
          } catch (secondParseError) {
            console.error('二次JSON解析也失败:', secondParseError)
          }
        }
        
        // 如果完全无法解析，返回原图纸
        return {
          success: false,
          message: '大模型返回格式错误，无法解析修改结果',
          nodes: nodes,
          edges: edges
        }
      }
    } catch (error) {
      console.error('智能修改图纸失败:', error)
      return {
        success: false,
        message: '智能修改失败: ' + error.message,
        nodes: nodes,
        edges: edges
      }
    }
  },

  // 生成随机位置
  generateRandomPosition() {
    return {
      x: 200 + Math.random() * 600,
      y: 150 + Math.random() * 400
    }
  },

  // 优化布局（简化版）
  optimizeLayout(nodes) {
    if (nodes.length <= 1) return

    const cols = Math.ceil(Math.sqrt(nodes.length))
    const spacing = 200

    nodes.forEach((node, index) => {
      if (!node.position || (node.position.x === 0 && node.position.y === 0)) {
        const row = Math.floor(index / cols)
        const col = index % cols
        node.position = {
          x: col * spacing + 150,
          y: row * spacing + 150
        }
      }
    })
  },

  // 解析Mermaid代码为JSON格式
  parseMermaidToJSON(mermaidCode) {
    try {
      // 提取mermaid代码块
      const mermaidMatch = mermaidCode.match(/```mermaid\n([\s\S]*?)\n```/)
      if (!mermaidMatch) {
        throw new Error('未找到有效的Mermaid代码')
      }

      const mermaidContent = mermaidMatch[1]
      const lines = mermaidContent.split('\n').filter(line => line.trim())

      const nodes = []
      const edges = []
      const nodeMap = new Map()

      // 添加节点的辅助函数
      const addNode = (id, label) => {
        if (!nodeMap.has(id)) {
          nodes.push({
            id: id,
            data: { label: label },
            position: { x: 0, y: 0 }, // 初始位置，后面会重新计算
            type: 'custom'
          })
          nodeMap.set(id, label)
        }
      }

      lines.forEach(line => {
        line = line.trim()
        if (line.startsWith('graph') || line.startsWith('%%') || !line) return

        // 匹配多种格式的边定义
        // 格式1: ID1["label1"] -- "edgeLabel" --> ID2["label2"]
        let edgeMatch = line.match(/(\w+)\s*\["([^"]+)"\]\s*--\s*"([^"]+)"\s*-->\s*(\w+)\s*\["([^"]+)"\]/)
        if (edgeMatch) {
          const [, id1, label1, edgeLabel, id2, label2] = edgeMatch
          addNode(id1, label1)
          addNode(id2, label2)
          edges.push({
            id: `${id1}-${id2}`,
            source: id1,
            target: id2,
            label: edgeLabel,
            type: 'bezier'
          })
          return
        }

        // 格式2: ID1["label1"] -- "edgeLabel" --> ID2
        edgeMatch = line.match(/(\w+)\s*\["([^"]+)"\]\s*--\s*"([^"]+)"\s*-->\s*(\w+)/)
        if (edgeMatch) {
          const [, id1, label1, edgeLabel, id2] = edgeMatch
          addNode(id1, label1)
          addNode(id2, id2) // 使用ID作为标签
          edges.push({
            id: `${id1}-${id2}`,
            source: id1,
            target: id2,
            label: edgeLabel,
            type: 'bezier'
          })
          return
        }

        // 格式3: ID1 -- "edgeLabel" --> ID2["label2"]
        edgeMatch = line.match(/(\w+)\s*--\s*"([^"]+)"\s*-->\s*(\w+)\s*\["([^"]+)"\]/)
        if (edgeMatch) {
          const [, id1, edgeLabel, id2, label2] = edgeMatch
          addNode(id1, id1) // 使用ID作为标签
          addNode(id2, label2)
          edges.push({
            id: `${id1}-${id2}`,
            source: id1,
            target: id2,
            label: edgeLabel,
            type: 'bezier'
          })
          return
        }

        // 格式4: ID1 -- "edgeLabel" --> ID2
        edgeMatch = line.match(/(\w+)\s*--\s*"([^"]+)"\s*-->\s*(\w+)/)
        if (edgeMatch) {
          const [, id1, edgeLabel, id2] = edgeMatch
          addNode(id1, id1)
          addNode(id2, id2)
          edges.push({
            id: `${id1}-${id2}`,
            source: id1,
            target: id2,
            label: edgeLabel,
            type: 'bezier'
          })
          return
        }

        // 格式5: ID1["label1"] --- ID2["label2"] (无向边)
        edgeMatch = line.match(/(\w+)\s*\["([^"]+)"\]\s*---\s*(\w+)\s*\["([^"]+)"\]/)
        if (edgeMatch) {
          const [, id1, label1, id2, label2] = edgeMatch
          addNode(id1, label1)
          addNode(id2, label2)
          edges.push({
            id: `${id1}-${id2}`,
            source: id1,
            target: id2,
            label: '关联',
            type: 'bezier'
          })
          return
        }

        // 格式6: ID1 --- ID2 (无向边，无标签)
        edgeMatch = line.match(/(\w+)\s*---\s*(\w+)/)
        if (edgeMatch) {
          const [, id1, id2] = edgeMatch
          addNode(id1, id1)
          addNode(id2, id2)
          edges.push({
            id: `${id1}-${id2}`,
            source: id1,
            target: id2,
            label: '关联',
            type: 'bezier'
          })
          return
        }

        // 格式7: ID1["label1"] --> ID2["label2"] (有向边，无边标签)
        edgeMatch = line.match(/(\w+)\s*\["([^"]+)"\]\s*-->\s*(\w+)\s*\["([^"]+)"\]/)
        if (edgeMatch) {
          const [, id1, label1, id2, label2] = edgeMatch
          addNode(id1, label1)
          addNode(id2, label2)
          edges.push({
            id: `${id1}-${id2}`,
            source: id1,
            target: id2,
            label: '关系',
            type: 'bezier'
          })
          return
        }
      })

      // 应用布局算法
      this.applyForceDirectedLayout(nodes, edges)

      // 为边添加智能连接桩选择
      this.assignHandlesToEdges(nodes, edges)

      console.log('解析结果:', { nodes, edges })
      return { nodes, edges }
    } catch (error) {
      console.error('Mermaid解析失败:', error)
      throw new Error('Mermaid代码解析失败')
    }
  },

  // 应用改进的网格布局算法
  applyForceDirectedLayout(nodes, edges) {
    if (nodes.length === 0) return

    // 圆形节点的尺寸参数
    const nodeRadius = 50 // 圆形节点半径
    const nodeDiameter = nodeRadius * 2 // 直径
    
    // 增加间距，确保节点之间有足够的空间
    const horizontalSpacing = nodeDiameter + 120 // 水平间距
    const verticalSpacing = nodeDiameter + 100 // 垂直间距
    
    // 计算网格布局
    const cols = Math.ceil(Math.sqrt(nodes.length))
    const rows = Math.ceil(nodes.length / cols)
    
    // 起始位置，让整个布局居中
    const startX = 200
    const startY = 150

    // 单个节点居中处理
    if (nodes.length === 1) {
      nodes[0].position = { x: 500, y: 350 }
      return
    }

    // 网格布局 - 节点边缘对齐
    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols

      // 节点边缘对齐 - 使用网格布局确保对齐
      node.position = {
        x: startX + col * horizontalSpacing,
        y: startY + row * verticalSpacing,
      }
    })

    console.log('草图布局优化完成:', {
      nodeCount: nodes.length,
      cols,
      rows,
      spacing: { horizontal: horizontalSpacing, vertical: verticalSpacing },
      positions: nodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }))
    })
  },

  // 为边分配智能连接桩
  assignHandlesToEdges(nodes, edges) {
    const nodeMap = new Map()
    nodes.forEach(node => nodeMap.set(node.id, node))

    edges.forEach(edge => {
      const sourceNode = nodeMap.get(edge.source)
      const targetNode = nodeMap.get(edge.target)

      if (sourceNode && targetNode) {
        const { sourceHandle, targetHandle } = this.getBestHandles(sourceNode, targetNode)
        edge.sourceHandle = sourceHandle
        edge.targetHandle = targetHandle
      }
    })
  },

  // 根据节点位置选择最佳连接桩
  getBestHandles(sourceNode, targetNode) {
    const dx = targetNode.position.x - sourceNode.position.x
    const dy = targetNode.position.y - sourceNode.position.y

    let sourceHandle, targetHandle

    // 根据相对位置选择连接桩
    if (Math.abs(dx) > Math.abs(dy)) {
      // 水平方向距离更大
      if (dx > 0) {
        sourceHandle = 'right'
        targetHandle = 'left-target'
      } else {
        sourceHandle = 'left'
        targetHandle = 'right-target'
      }
    } else {
      // 垂直方向距离更大
      if (dy > 0) {
        sourceHandle = 'bottom'
        targetHandle = 'top-target'
      } else {
        sourceHandle = 'top'
        targetHandle = 'bottom-target'
      }
    }

    return { sourceHandle, targetHandle }
  }
} 