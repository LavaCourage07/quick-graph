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

// 本体优化提示词
const ENTITY_OPTIMIZATION_PROMPT = `你是一名工业知识建模专家，专门负责优化节点（实体）的信息。

当前节点信息：
{nodeInfo}

用户优化需求：{userInput}

请根据用户的需求，对这个节点进行智能优化。优化内容可能包括：
1. 完善节点的中文名称，使其更准确、专业
2. 补充或修正英文名称
3. 丰富节点的描述信息
4. 添加或完善技术参数
5. 补充功能特征信息
6. 修正或优化其他属性

**优化原则**：
- 保持工业领域的专业性和准确性
- 优化后的信息应该更加详细和完整
- 英文名称应符合国际标准术语
- 描述应该简洁明了，突出关键特征
- 参数和特征应该具有实际意义

请返回优化后的节点数据，格式如下：
{
  "success": true,
  "message": "优化说明",
  "optimizedNode": {
    "id": "节点ID（保持不变）",
    "label": "优化后的中文名称",
    "englishName": "优化后的英文名称",
    "description": "优化后的详细描述",
    "parameters": ["参数1", "参数2", "..."],
    "features": ["特征1", "特征2", "..."],
    "type": "节点类型",
    "category": "节点分类"
  },
  "changes": [
    {
      "field": "修改的字段名",
      "oldValue": "原始值",
      "newValue": "新值",
      "reason": "修改原因"
    }
  ]
}

请确保返回的是有效的JSON格式，不要包含任何其他文字。`

// 关系优化提示词
const RELATION_OPTIMIZATION_PROMPT = `你是一名工业知识建模专家，专门负责优化边（关系）的信息。

当前关系信息：
{relationInfo}

连接的节点信息：
源节点：{sourceNode}
目标节点：{targetNode}

用户优化需求：{userInput}

请根据用户的需求，对这个关系进行智能优化。优化内容可能包括：
1. 完善关系的中文名称，使其更准确地表达两个节点之间的联系
2. 补充或修正英文名称
3. 丰富关系的描述信息
4. 添加或完善关系参数（如流量、压力、温度等）
5. 补充关系特征信息
6. 修正关系的方向性或类型

**优化原则**：
- 关系名称应该准确反映两个节点之间的实际联系
- 保持工业领域的专业性和准确性
- 英文名称应符合国际标准术语
- 描述应该明确说明关系的性质和作用
- 参数应该与关系类型相匹配

请返回优化后的关系数据，格式如下：
{
  "success": true,
  "message": "优化说明",
  "optimizedRelation": {
    "id": "关系ID（保持不变）",
    "label": "优化后的中文名称",
    "englishName": "优化后的英文名称",
    "description": "优化后的详细描述",
    "parameters": ["参数1", "参数2", "..."],
    "features": ["特征1", "特征2", "..."],
    "type": "关系类型",
    "direction": "关系方向（directed/undirected）",
    "category": "关系分类"
  },
  "changes": [
    {
      "field": "修改的字段名",
      "oldValue": "原始值",
      "newValue": "新值",
      "reason": "修改原因"
    }
  ]
}

请确保返回的是有效的JSON格式，不要包含任何其他文字。`

// 请求缓存
const requestCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

// 错误处理和重试机制
const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      console.warn(`请求失败，第 ${i + 1} 次重试:`, error.message)
      
      if (i === maxRetries - 1) {
        throw error
      }
      
      // 指数退避延迟
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
}

// 生成缓存键
const generateCacheKey = (method, params) => {
  return `${method}_${JSON.stringify(params)}`
}

// 检查缓存
const getFromCache = (key) => {
  const cached = requestCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('使用缓存结果:', key)
    return cached.data
  }
  return null
}

// 设置缓存
const setCache = (key, data) => {
  requestCache.set(key, {
    data,
    timestamp: Date.now()
  })
  
  // 清理过期缓存
  if (requestCache.size > 100) {
    const now = Date.now()
    for (const [k, v] of requestCache.entries()) {
      if (now - v.timestamp > CACHE_DURATION) {
        requestCache.delete(k)
      }
    }
  }
}

// 验证AI响应格式
const validateResponse = (response, expectedFields = []) => {
  if (!response || typeof response !== 'object') {
    throw new Error('AI响应格式无效')
  }
  
  for (const field of expectedFields) {
    if (!(field in response)) {
      console.warn(`AI响应缺少必需字段: ${field}`)
    }
  }
  
  return true
}

// 子图分析提示词
const SUBGRAPH_ANALYSIS_PROMPT = `你是一名工业知识建模专家，专门负责对子图进行深度分析。

当前子图信息：
节点列表：{nodes}
边列表：{edges}

请对这个子图进行全面的深度分析，包括：

1. **结构分析**：
   - 图的拓扑结构特征
   - 节点连通性分析
   - 关键节点识别

2. **信息完整性评估**：
   - 节点信息完整程度
   - 关系描述准确性
   - 缺失信息识别

3. **逻辑一致性检查**：
   - 节点间关系的合理性
   - 可能的逻辑错误
   - 冗余或矛盾信息

4. **优化机会识别**：
   - 可以改进的节点
   - 可以优化的关系
   - 可能缺失的连接

请返回详细的分析结果，格式如下：
{
  "success": true,
  "analysisId": "分析ID",
  "overallScore": 85,
  "summary": "整体分析总结",
  "structureAnalysis": {
    "connectivity": "连通性评估",
    "keyNodes": ["关键节点列表"],
    "topology": "拓扑特征描述"
  },
  "completenessAssessment": {
    "nodeCompleteness": 0.75,
    "edgeCompleteness": 0.60,
    "missingInfo": ["缺失信息列表"]
  },
  "logicalConsistency": {
    "consistencyScore": 0.80,
    "issues": [
      {
        "type": "逻辑问题类型",
        "description": "问题描述",
        "affectedElements": ["受影响的元素"]
      }
    ]
  },
  "optimizationOpportunities": {
    "nodeOptimizations": [
      {
        "nodeId": "节点ID",
        "suggestions": ["优化建议列表"]
      }
    ],
    "edgeOptimizations": [
      {
        "edgeId": "边ID",
        "suggestions": ["优化建议列表"]
      }
    ],
    "missingConnections": [
      {
        "source": "源节点",
        "target": "目标节点",
        "reason": "建议连接的原因"
      }
    ]
  }
}

请确保返回的是有效的JSON格式，不要包含任何其他文字。`

// 语言交互优化提示词
const LANGUAGE_OPTIMIZATION_PROMPT = `你是工业知识建模专家。根据用户需求修改子图。

支持操作：增加/删除节点、增加/删除边、修改名称

返回JSON格式：
{
  "success": true,
  "message": "操作描述",
  "optimizedSubgraph": {
    "nodes": [{"id": "ID", "type": "rect", "position": {"x": 100, "y": 100}, "data": {"label": "名称"}}],
    "edges": [{"id": "ID", "source": "源ID", "target": "目标ID", "type": "bezier", "label": "名称"}]
  },
  "changes": {"nodeChanges": [], "edgeChanges": []},
  "statistics": {"nodesOptimized": 0, "edgesOptimized": 0, "newConnections": 0}
}

规则：保持原ID不变，新增需唯一ID，删除节点时删除相关边。`

// 整体优化提示词
const OVERALL_OPTIMIZATION_PROMPT = `你是一名工业知识建模专家，专门负责对子图进行整体优化。

当前子图信息：
节点列表：{nodes}
边列表：{edges}

分析结果：{analysisResult}

用户优化需求：{userInput}

请基于分析结果和用户需求，对整个子图进行智能优化。优化内容包括：

1. **节点优化**：
   - 完善节点信息（名称、描述、参数等）
   - 修正不准确的节点属性
   - 统一节点命名规范

2. **关系优化**：
   - 完善关系描述和参数
   - 修正不合理的关系
   - 添加缺失的重要连接

3. **结构优化**：
   - 优化图的整体结构
   - 改进信息组织方式
   - 增强逻辑清晰度
   - **必须新增至少1个与现有节点相连的新节点**，不能是孤立节点

4. **专业性提升**：
   - 使用标准的工业术语
   - 添加英文对照
   - 完善技术参数

**重要要求**：
- **必须新增至少1个新节点**，该节点必须与子图中的现有节点有连接关系
- 新增的节点应该是对当前子图功能的合理补充或扩展
- 新增的连接关系应该符合业务逻辑和工程实际

**优化原则**：
- 保持原有结构的合理部分
- 优先解决分析中发现的问题
- 确保优化后的信息准确性
- 提升整体的专业性和可读性
- 新增元素必须与现有系统逻辑一致

请返回优化后的完整子图数据，格式如下：
{
  "success": true,
  "optimizationId": "优化ID",
  "message": "优化说明",
  "optimizedSubgraph": {
    "nodes": [优化后的节点数组],
    "edges": [优化后的边数组]
  },
  "changes": {
    "nodeChanges": [节点变更记录],
    "edgeChanges": [边变更记录]
  },
  "statistics": {
    "nodesOptimized": 5,
    "edgesOptimized": 3,
    "newConnections": 2,
    "improvementScore": 0.25
  }
}

请确保返回的是有效的JSON格式，不要包含任何其他文字。`

export const kimiAPI = {
  // 本体优化
  async optimizeEntity(nodeInfo, userInput, subgraphContext = null) {
    const cacheKey = generateCacheKey('optimizeEntity', { nodeId: nodeInfo.id, userInput })
    
    // 检查缓存
    const cachedResult = getFromCache(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    return withRetry(async () => {
      console.log('开始本体优化:', { nodeId: nodeInfo.id, userInput })

      // 准备节点信息
      const nodeData = {
        id: nodeInfo.id,
        label: nodeInfo.data?.label || nodeInfo.label || '未命名',
        englishName: nodeInfo.data?.englishName || '',
        description: nodeInfo.data?.description || '',
        parameters: nodeInfo.data?.parameters || [],
        features: nodeInfo.data?.features || [],
        type: nodeInfo.type || 'custom',
        category: nodeInfo.data?.category || ''
      }

      const prompt = ENTITY_OPTIMIZATION_PROMPT
        .replace('{nodeInfo}', JSON.stringify(nodeData, null, 2))
        .replace('{userInput}', userInput)

      const response = await kimiClient.post('', {
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: '请根据用户需求优化这个节点'
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })

      const result = response.data.choices[0].message.content
      console.log('本体优化返回结果:', result)

      // 尝试解析JSON结果
      try {
        const optimizationResult = JSON.parse(result)
        
        if (!optimizationResult.success) {
          return {
            success: false,
            message: optimizationResult.message || '优化失败',
            originalNode: nodeInfo,
            optimizedNode: null,
            changes: []
          }
        }

        const result = {
          success: true,
          message: optimizationResult.message || '节点优化成功',
          originalNode: nodeInfo,
          optimizedNode: optimizationResult.optimizedNode,
          changes: optimizationResult.changes || []
        }

        // 验证响应格式并设置缓存
        validateResponse(optimizationResult, ['success', 'optimizedNode'])
        setCache(cacheKey, result)
        
        return result

      } catch (parseError) {
        console.error('本体优化JSON解析失败:', parseError)
        // 尝试提取JSON部分
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const optimizationResult = JSON.parse(jsonMatch[0])
            return {
              success: optimizationResult.success || false,
              message: optimizationResult.message || '节点优化完成',
              originalNode: nodeInfo,
              optimizedNode: optimizationResult.optimizedNode || null,
              changes: optimizationResult.changes || []
            }
          } catch (secondParseError) {
            console.error('二次JSON解析也失败:', secondParseError)
          }
        }
        
        return {
          success: false,
          message: 'AI返回格式错误，无法解析优化结果',
          originalNode: nodeInfo,
          optimizedNode: null,
          changes: []
        }
      }
    })
  },

  // 子图分析
  async analyzeSubgraph(subgraphData) {
    const cacheKey = generateCacheKey('analyzeSubgraph', { 
      nodeCount: subgraphData.nodes.length,
      edgeCount: subgraphData.edges.length,
      nodeIds: subgraphData.nodes.map(n => n.id).sort()
    })
    
    // 检查缓存
    const cachedResult = getFromCache(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    return withRetry(async () => {
      console.log('开始子图分析:', { 
        nodes: subgraphData.nodes.length, 
        edges: subgraphData.edges.length 
      })

      // 准备子图数据
      const nodeData = subgraphData.nodes.map(node => ({
        id: node.id,
        label: node.data?.label || '未命名',
        englishName: node.data?.englishName || '',
        description: node.data?.description || '',
        parameters: node.data?.parameters || [],
        features: node.data?.features || [],
        type: node.type || 'custom'
      }))

      const edgeData = subgraphData.edges.map(edge => ({
        id: edge.id,
        label: edge.label || '未命名关系',
        source: edge.source,
        target: edge.target,
        englishName: edge.data?.englishName || '',
        description: edge.data?.description || '',
        type: edge.type || 'bezier'
      }))

      const prompt = SUBGRAPH_ANALYSIS_PROMPT
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
            content: '请对这个子图进行深度分析'
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })

      const result = response.data.choices[0].message.content
      console.log('子图分析返回结果:', result)

      // 尝试解析JSON结果
      try {
        const analysisResult = JSON.parse(result)
        
        if (!analysisResult.success) {
          return {
            success: false,
            message: analysisResult.message || '分析失败',
            analysisResult: null
          }
        }

        const finalResult = {
          success: true,
          message: '子图分析完成',
          analysisResult: analysisResult
        }

        // 验证响应格式并设置缓存
        validateResponse(analysisResult, ['success', 'overallScore', 'summary'])
        setCache(cacheKey, finalResult)
        
        return finalResult

      } catch (parseError) {
        console.error('子图分析JSON解析失败:', parseError)
        // 尝试提取JSON部分
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const analysisResult = JSON.parse(jsonMatch[0])
            return {
              success: analysisResult.success || false,
              message: '子图分析完成',
              analysisResult: analysisResult
            }
          } catch (secondParseError) {
            console.error('二次JSON解析也失败:', secondParseError)
          }
        }
        
        return {
          success: false,
          message: 'AI返回格式错误，无法解析分析结果',
          analysisResult: null
        }
      }
    })
  },

  // 整体优化
  async optimizeOverall(subgraphData, analysisResult, userInput = '') {
    const cacheKey = generateCacheKey('optimizeOverall', { 
      nodeCount: subgraphData.nodes.length,
      edgeCount: subgraphData.edges.length,
      userInput,
      analysisId: analysisResult?.analysisId
    })
    
    // 检查缓存
    const cachedResult = getFromCache(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    return withRetry(async () => {
      console.log('开始整体优化:', { 
        nodes: subgraphData.nodes.length, 
        edges: subgraphData.edges.length,
        userInput 
      })

      // 准备子图数据
      const nodeData = subgraphData.nodes.map(node => ({
        id: node.id,
        label: node.data?.label || '未命名',
        englishName: node.data?.englishName || '',
        description: node.data?.description || '',
        parameters: node.data?.parameters || [],
        features: node.data?.features || [],
        type: node.type || 'custom',
        position: node.position
      }))

      const edgeData = subgraphData.edges.map(edge => ({
        id: edge.id,
        label: edge.label || '未命名关系',
        source: edge.source,
        target: edge.target,
        englishName: edge.data?.englishName || '',
        description: edge.data?.description || '',
        parameters: edge.data?.parameters || [],
        features: edge.data?.features || [],
        type: edge.type || 'bezier'
      }))

      const prompt = OVERALL_OPTIMIZATION_PROMPT
        .replace('{nodes}', JSON.stringify(nodeData, null, 2))
        .replace('{edges}', JSON.stringify(edgeData, null, 2))
        .replace('{analysisResult}', JSON.stringify(analysisResult, null, 2))
        .replace('{userInput}', userInput || '请根据分析结果进行整体优化')

      const response = await kimiClient.post('', {
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: '请对这个子图进行整体优化'
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })

      const result = response.data.choices[0].message.content
      console.log('整体优化返回结果:', result)

      // 尝试解析JSON结果
      try {
        const optimizationResult = JSON.parse(result)
        
        if (!optimizationResult.success) {
          return {
            success: false,
            message: optimizationResult.message || '优化失败',
            originalSubgraph: subgraphData,
            optimizedSubgraph: null,
            changes: null,
            statistics: null
          }
        }

        const finalResult = {
          success: true,
          message: optimizationResult.message || '整体优化完成',
          originalSubgraph: subgraphData,
          optimizedSubgraph: optimizationResult.optimizedSubgraph,
          changes: optimizationResult.changes,
          statistics: optimizationResult.statistics
        }

        // 验证响应格式并设置缓存
        validateResponse(optimizationResult, ['success', 'optimizedSubgraph'])
        setCache(cacheKey, finalResult)
        
        return finalResult

      } catch (parseError) {
        console.error('整体优化JSON解析失败:', parseError)
        // 尝试提取JSON部分
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const optimizationResult = JSON.parse(jsonMatch[0])
            return {
              success: optimizationResult.success || false,
              message: optimizationResult.message || '整体优化完成',
              originalSubgraph: subgraphData,
              optimizedSubgraph: optimizationResult.optimizedSubgraph || null,
              changes: optimizationResult.changes || null,
              statistics: optimizationResult.statistics || null
            }
          } catch (secondParseError) {
            console.error('二次JSON解析也失败:', secondParseError)
          }
        }
        
        return {
          success: false,
          message: 'AI返回格式错误，无法解析优化结果',
          originalSubgraph: subgraphData,
          optimizedSubgraph: null,
          changes: null,
          statistics: null
        }
      }
    })
  },

  // 关系优化
  async optimizeRelation(relationInfo, sourceNode, targetNode, userInput, subgraphContext = null) {
    const cacheKey = generateCacheKey('optimizeRelation', { 
      relationId: relationInfo.id, 
      userInput,
      sourceId: sourceNode.id,
      targetId: targetNode.id
    })
    
    // 检查缓存
    const cachedResult = getFromCache(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    return withRetry(async () => {
      console.log('开始关系优化:', { relationId: relationInfo.id, userInput })

      // 准备关系信息
      const relationData = {
        id: relationInfo.id,
        label: relationInfo.label || '未命名关系',
        englishName: relationInfo.data?.englishName || '',
        description: relationInfo.data?.description || '',
        parameters: relationInfo.data?.parameters || [],
        features: relationInfo.data?.features || [],
        type: relationInfo.type || 'bezier',
        direction: relationInfo.data?.direction || 'directed',
        category: relationInfo.data?.category || ''
      }

      // 准备源节点和目标节点信息
      const sourceNodeData = {
        id: sourceNode.id,
        label: sourceNode.data?.label || sourceNode.label || '未命名',
        type: sourceNode.type || 'custom'
      }

      const targetNodeData = {
        id: targetNode.id,
        label: targetNode.data?.label || targetNode.label || '未命名',
        type: targetNode.type || 'custom'
      }

      const prompt = RELATION_OPTIMIZATION_PROMPT
        .replace('{relationInfo}', JSON.stringify(relationData, null, 2))
        .replace('{sourceNode}', JSON.stringify(sourceNodeData, null, 2))
        .replace('{targetNode}', JSON.stringify(targetNodeData, null, 2))
        .replace('{userInput}', userInput)

      const response = await kimiClient.post('', {
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: '请根据用户需求优化这个关系'
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })

      const result = response.data.choices[0].message.content
      console.log('关系优化返回结果:', result)

      // 尝试解析JSON结果
      try {
        const optimizationResult = JSON.parse(result)
        
        if (!optimizationResult.success) {
          return {
            success: false,
            message: optimizationResult.message || '优化失败',
            originalRelation: relationInfo,
            optimizedRelation: null,
            changes: []
          }
        }

        const result = {
          success: true,
          message: optimizationResult.message || '关系优化成功',
          originalRelation: relationInfo,
          optimizedRelation: optimizationResult.optimizedRelation,
          changes: optimizationResult.changes || []
        }

        // 验证响应格式并设置缓存
        validateResponse(optimizationResult, ['success', 'optimizedRelation'])
        setCache(cacheKey, result)
        
        return result

      } catch (parseError) {
        console.error('关系优化JSON解析失败:', parseError)
        // 尝试提取JSON部分
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const optimizationResult = JSON.parse(jsonMatch[0])
            return {
              success: optimizationResult.success || false,
              message: optimizationResult.message || '关系优化完成',
              originalRelation: relationInfo,
              optimizedRelation: optimizationResult.optimizedRelation || null,
              changes: optimizationResult.changes || []
            }
          } catch (secondParseError) {
            console.error('二次JSON解析也失败:', secondParseError)
          }
        }
        
        return {
          success: false,
          message: 'AI返回格式错误，无法解析优化结果',
          originalRelation: relationInfo,
          optimizedRelation: null,
          changes: []
        }
      }
    })
  },

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
  },

  // 语言交互优化
  async optimizeByLanguage(subgraphData, userInput) {
    try {
      console.log('开始语言交互优化:', { userInput, subgraphData })

      // 清理子图数据，只保留必要字段
      const cleanNodes = (subgraphData.nodes || []).map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          label: node.data?.label || '',
          englishName: node.data?.englishName || '',
          description: node.data?.description || '',
          parameters: node.data?.parameters || [],
          features: node.data?.features || []
        }
      }))

      const cleanEdges = (subgraphData.edges || []).map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        label: edge.label || edge.data?.label || '',
        data: {
          englishName: edge.data?.englishName || '',
          description: edge.data?.description || '',
          parameters: edge.data?.parameters || [],
          features: edge.data?.features || []
        }
      }))

      const response = await kimiClient.post('', {
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: LANGUAGE_OPTIMIZATION_PROMPT
          },
          {
            role: 'user',
            content: `当前子图数据：\n节点：${JSON.stringify(cleanNodes, null, 2)}\n边：${JSON.stringify(cleanEdges, null, 2)}\n\n用户需求：${userInput}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })

      const content = response.data.choices[0].message.content
      console.log('AI语言优化响应:', content)

      // 尝试解析JSON响应
      try {
        const result = JSON.parse(content)
        
        if (result.success) {
          console.log('语言优化成功:', result)
          return result
        } else {
          console.error('语言优化失败:', result.message)
          return {
            success: false,
            message: result.message || '语言优化失败'
          }
        }
      } catch (parseError) {
        console.error('解析AI响应失败:', parseError)
        return {
          success: false,
          message: 'AI响应格式错误，无法解析结果'
        }
      }
    } catch (error) {
      console.error('语言交互优化API调用失败:', error)
      return {
        success: false,
        message: 'API调用失败: ' + error.message
      }
    }
  }
} 