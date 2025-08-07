// 测试Mermaid解析功能
const testMermaidCode = `\`\`\`mermaid
graph TD
  DK101["染缸 DK-101"] -- "处理" --> Batch["坯布批次"]
  DK102["染缸 DK-102"] -- "处理" --> Batch
  B01["锅炉 B-01"] -- "提供" --> DK101
  B01 -- "提供" --> DK102
  CT01["冷却塔 CT-01"] -- "循环" --> DK101
  CT01 --- DK102
  DyeTank01["Dye-Tank-01"] -- "输送" --> PDY01["计量泵 P-DY-01"]
  PDY01 --- DK101
  PDY01 --- DK102
  CondTank01["Cond-Tank-01"] -- "回收" --> DK101
  CondTank01 --- DK102
\`\`\``;

// 模拟解析函数
function parseMermaidToJSON(mermaidCode) {
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
          type: 'default',
          style: {
            background: '#ffffff',
            border: '2px solid #4068D4',
            borderRadius: '50%',
            width: '120px',
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            textAlign: 'center',
            padding: '10px',
            boxSizing: 'border-box'
          }
        })
        nodeMap.set(id, label)
      }
    }

    lines.forEach(line => {
      line = line.trim()
      if (line.startsWith('graph') || line.startsWith('%%') || !line) return

      console.log('处理行:', line)

      // 匹配多种格式的边定义
      // 格式1: ID1["label1"] -- "edgeLabel" --> ID2["label2"]
      let edgeMatch = line.match(/(\w+)\s*\["([^"]+)"\]\s*--\s*"([^"]+)"\s*-->\s*(\w+)\s*\["([^"]+)"\]/)
      if (edgeMatch) {
        const [, id1, label1, edgeLabel, id2, label2] = edgeMatch
        console.log('匹配格式1:', { id1, label1, edgeLabel, id2, label2 })
        addNode(id1, label1)
        addNode(id2, label2)
        edges.push({
          id: `${id1}-${id2}`,
          source: id1,
          target: id2,
          data: { label: edgeLabel },
          type: 'smoothstep'
        })
        return
      }

      // 格式2: ID1["label1"] -- "edgeLabel" --> ID2
      edgeMatch = line.match(/(\w+)\s*\["([^"]+)"\]\s*--\s*"([^"]+)"\s*-->\s*(\w+)/)
      if (edgeMatch) {
        const [, id1, label1, edgeLabel, id2] = edgeMatch
        console.log('匹配格式2:', { id1, label1, edgeLabel, id2 })
        addNode(id1, label1)
        addNode(id2, id2) // 使用ID作为标签
        edges.push({
          id: `${id1}-${id2}`,
          source: id1,
          target: id2,
          data: { label: edgeLabel },
          type: 'smoothstep'
        })
        return
      }

      // 格式3: ID1 -- "edgeLabel" --> ID2["label2"]
      edgeMatch = line.match(/(\w+)\s*--\s*"([^"]+)"\s*-->\s*(\w+)\s*\["([^"]+)"\]/)
      if (edgeMatch) {
        const [, id1, edgeLabel, id2, label2] = edgeMatch
        console.log('匹配格式3:', { id1, edgeLabel, id2, label2 })
        addNode(id1, id1) // 使用ID作为标签
        addNode(id2, label2)
        edges.push({
          id: `${id1}-${id2}`,
          source: id1,
          target: id2,
          data: { label: edgeLabel },
          type: 'smoothstep'
        })
        return
      }

      // 格式4: ID1 -- "edgeLabel" --> ID2
      edgeMatch = line.match(/(\w+)\s*--\s*"([^"]+)"\s*-->\s*(\w+)/)
      if (edgeMatch) {
        const [, id1, edgeLabel, id2] = edgeMatch
        console.log('匹配格式4:', { id1, edgeLabel, id2 })
        addNode(id1, id1)
        addNode(id2, id2)
        edges.push({
          id: `${id1}-${id2}`,
          source: id1,
          target: id2,
          data: { label: edgeLabel },
          type: 'smoothstep'
        })
        return
      }

      // 格式5: ID1["label1"] --- ID2["label2"] (无向边)
      edgeMatch = line.match(/(\w+)\s*\["([^"]+)"\]\s*---\s*(\w+)\s*\["([^"]+)"\]/)
      if (edgeMatch) {
        const [, id1, label1, id2, label2] = edgeMatch
        console.log('匹配格式5:', { id1, label1, id2, label2 })
        addNode(id1, label1)
        addNode(id2, label2)
        edges.push({
          id: `${id1}-${id2}`,
          source: id1,
          target: id2,
          data: { label: '关联' },
          type: 'smoothstep'
        })
        return
      }

      // 格式6: ID1 --- ID2 (无向边，无标签)
      edgeMatch = line.match(/(\w+)\s*---\s*(\w+)/)
      if (edgeMatch) {
        const [, id1, id2] = edgeMatch
        console.log('匹配格式6:', { id1, id2 })
        addNode(id1, id1)
        addNode(id2, id2)
        edges.push({
          id: `${id1}-${id2}`,
          source: id1,
          target: id2,
          data: { label: '关联' },
          type: 'smoothstep'
        })
        return
      }

      // 格式7: ID1["label1"] --> ID2["label2"] (有向边，无边标签)
      edgeMatch = line.match(/(\w+)\s*\["([^"]+)"\]\s*-->\s*(\w+)\s*\["([^"]+)"\]/)
      if (edgeMatch) {
        const [, id1, label1, id2, label2] = edgeMatch
        console.log('匹配格式7:', { id1, label1, id2, label2 })
        addNode(id1, label1)
        addNode(id2, label2)
        edges.push({
          id: `${id1}-${id2}`,
          source: id1,
          target: id2,
          data: { label: '关系' },
          type: 'smoothstep'
        })
        return
      }

      console.log('未匹配的行:', line)
    })

    // 应用布局算法
    applyForceDirectedLayout(nodes, edges)
    
    console.log('解析结果:', { nodes, edges })
    return { nodes, edges }
  } catch (error) {
    console.error('Mermaid解析失败:', error)
    throw new Error('Mermaid代码解析失败')
  }
}

// 添加力导向布局算法
function applyForceDirectedLayout(nodes, edges) {
  if (nodes.length === 0) return

  const centerX = 500
  const centerY = 350
  const canvasWidth = 1000
  const canvasHeight = 700

  if (nodes.length === 1) {
    nodes[0].position = { x: centerX, y: centerY }
    return
  }

  // 初始化节点位置（随机分布）
  nodes.forEach(node => {
    node.position = {
      x: centerX + (Math.random() - 0.5) * 200,
      y: centerY + (Math.random() - 0.5) * 200
    }
    node.vx = 0
    node.vy = 0
  })

  // 构建邻接表
  const adjacency = new Map()
  nodes.forEach(node => adjacency.set(node.id, new Set()))
  
  edges.forEach(edge => {
    adjacency.get(edge.source).add(edge.target)
    adjacency.get(edge.target).add(edge.source)
  })

  // 力导向算法参数
  const iterations = 300
  const nodeRadius = 60
  const springLength = 150
  const springStrength = 0.1
  const repulsionStrength = 8000
  const centeringForce = 0.02
  const damping = 0.9

  // 迭代计算
  for (let iter = 0; iter < iterations; iter++) {
    const alpha = Math.max(0.1, 1 - iter / iterations) // 逐渐减小的学习率

    nodes.forEach(node => {
      let fx = 0, fy = 0

      // 1. 弹簧力（连接的节点相互吸引）
      adjacency.get(node.id).forEach(neighborId => {
        const neighbor = nodes.find(n => n.id === neighborId)
        if (neighbor) {
          const dx = neighbor.position.x - node.position.x
          const dy = neighbor.position.y - node.position.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          
          const force = springStrength * (distance - springLength)
          fx += (dx / distance) * force
          fy += (dy / distance) * force
        }
      })

      // 2. 排斥力（所有节点相互排斥）
      nodes.forEach(other => {
        if (other.id !== node.id) {
          const dx = node.position.x - other.position.x
          const dy = node.position.y - other.position.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          
          if (distance < nodeRadius * 3) {
            const force = repulsionStrength / (distance * distance)
            fx += (dx / distance) * force
            fy += (dy / distance) * force
          }
        }
      })

      // 3. 向心力（防止节点飞得太远）
      const centerDx = centerX - node.position.x
      const centerDy = centerY - node.position.y
      fx += centerDx * centeringForce
      fy += centerDy * centeringForce

      // 更新速度和位置
      node.vx = (node.vx + fx * alpha) * damping
      node.vy = (node.vy + fy * alpha) * damping
      
      node.position.x += node.vx
      node.position.y += node.vy

      // 边界约束
      node.position.x = Math.max(nodeRadius, Math.min(canvasWidth - nodeRadius, node.position.x))
      node.position.y = Math.max(nodeRadius, Math.min(canvasHeight - nodeRadius, node.position.y))
    })
  }

  // 清理临时属性
  nodes.forEach(node => {
    delete node.vx
    delete node.vy
    node.position.x = Math.round(node.position.x)
    node.position.y = Math.round(node.position.y)
  })
}

// 运行测试
const result = parseMermaidToJSON(testMermaidCode)
console.log('最终结果:')
console.log('节点数量:', result.nodes.length)
console.log('边数量:', result.edges.length)
console.log('节点:', result.nodes.map(n => ({ id: n.id, label: n.data.label, position: n.position, style: n.style })))
console.log('边:', result.edges.map(e => ({ id: e.id, source: e.source, target: e.target, label: e.data.label, type: e.type })))