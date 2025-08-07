// 测试批量增强功能
const axios = require('axios')

const KIMI_API_KEY = 'sk-7NRPjLXjrQkIrgKsXu1pKJGydDtSC8iY6EtghcppOFw5iQkw'
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions'

const kimiClient = axios.create({
  baseURL: KIMI_API_URL,
  headers: {
    'Authorization': `Bearer ${KIMI_API_KEY}`,
    'Content-Type': 'application/json'
  }
})

// 批量增强提示词
const BATCH_ENHANCEMENT_PROMPT = `你是一名工业知识建模专家。请对以下图表中的所有节点和边进行详细的信息补充和完善。

图表数据：
节点列表：{nodes}
边列表：{edges}

请为每个节点和边提供以下信息，并以JSON格式返回：
1. 中文名称（保持原有）
2. 英文名称
3. 详细描述
4. 技术参数列表（数组格式）
5. 功能特点列表（数组格式）

返回格式示例：
{
  "nodes": [
    {
      "id": "节点ID",
      "chineseName": "中文名称",
      "englishName": "English Name",
      "description": "详细描述",
      "parameters": ["参数1", "参数2"],
      "features": ["特点1", "特点2"]
    }
  ],
  "edges": [
    {
      "id": "边ID",
      "chineseName": "中文名称",
      "englishName": "English Name", 
      "description": "详细描述",
      "parameters": ["参数1", "参数2"],
      "features": ["特点1", "特点2"]
    }
  ]
}

请确保返回的是有效的JSON格式，不要包含任何其他文字。`

// 批量增强节点和边信息
async function batchEnhanceGraph(nodes, edges) {
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

    console.log('发送给大模型的提示词:')
    console.log(prompt)
    console.log('\n===================\n')

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
    console.log('大模型原始返回结果:')
    console.log(result)
    console.log('\n===================\n')
    
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
}

// 模拟草图数据
const testNodes = [
  {
    id: 'DK101',
    data: { label: '染缸 DK-101' },
    position: { x: 100, y: 100 },
    type: 'custom'
  },
  {
    id: 'B01',
    data: { label: '锅炉 B-01' },
    position: { x: 200, y: 200 },
    type: 'custom'
  }
]

const testEdges = [
  {
    id: 'B01-DK101',
    source: 'B01',
    target: 'DK101',
    label: '提供蒸汽',
    type: 'bezier'
  }
]

async function testBatchEnhance() {
  console.log('开始测试批量增强功能...')
  console.log('输入数据:')
  console.log('节点:', testNodes)
  console.log('边:', testEdges)
  
  try {
    const result = await batchEnhanceGraph(testNodes, testEdges)
    console.log('增强结果:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('测试失败:', error)
  }
}

testBatchEnhance()