'use client'
// src/components/graph/GraphVisualization.tsx
import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'

interface Node {
  id: string
  label: string
  isEntrepot?: boolean
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface Edge {
  id: string
  source: string | Node
  target: string | Node
  distance: number
}

interface Props {
  nodes: Node[]
  edges: Edge[]
  height?: number
  selectedPath?: string[]
  onNodeClick?: (nodeId: string) => void
}

export default function GraphVisualization({
  nodes,
  edges,
  height = 420,
  selectedPath = [],
  onNodeClick,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<Node, Edge> | null>(null)

  const isOnPath = useCallback(
    (id: string) => selectedPath.includes(id),
    [selectedPath]
  )

  const isEdgeOnPath = useCallback(
    (edge: Edge) => {
      if (selectedPath.length < 2) return false
      const srcId = typeof edge.source === 'string' ? edge.source : edge.source.id
      const tgtId = typeof edge.target === 'string' ? edge.target : edge.target.id
      for (let i = 0; i < selectedPath.length - 1; i++) {
        if (
          (selectedPath[i] === srcId && selectedPath[i + 1] === tgtId) ||
          (selectedPath[i] === tgtId && selectedPath[i + 1] === srcId)
        ) {
          return true
        }
      }
      return false
    },
    [selectedPath]
  )

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth || 600

    // Définir les marqueurs de flèche
    const defs = svg.append('defs')
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94a3b8')

    defs.append('marker')
      .attr('id', 'arrowhead-path')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#16a34a')

    // Conteneur zoomable
    const g = svg.append('g')

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    svg.call(zoom)

    // Simulation de force
    const nodesCopy: Node[] = nodes.map(n => ({ ...n }))
    const edgesCopy: Edge[] = edges.map(e => ({ ...e }))

    // Fixer l'entrepôt au centre
    const entrepotNode = nodesCopy.find(n => n.isEntrepot)
    if (entrepotNode) {
      entrepotNode.fx = width / 2
      entrepotNode.fy = height / 2
    }

    const simulation = d3.forceSimulation<Node>(nodesCopy)
      .force('link', d3.forceLink<Node, Edge>(edgesCopy)
        .id(d => d.id)
        .distance(d => Math.max(60, d.distance * 6))
        .strength(0.3)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(40))

    simulationRef.current = simulation

    // Arêtes
    const link = g.append('g')
      .selectAll<SVGLineElement, Edge>('line')
      .data(edgesCopy)
      .join('line')
      .attr('stroke', d => isEdgeOnPath(d) ? '#16a34a' : '#94a3b8')
      .attr('stroke-width', d => isEdgeOnPath(d) ? 3 : 1.5)
      .attr('stroke-dasharray', d => isEdgeOnPath(d) ? '8 4' : 'none')
      .attr('marker-end', d => isEdgeOnPath(d) ? 'url(#arrowhead-path)' : 'url(#arrowhead)')
      .attr('opacity', 0.8)

    // Labels des arêtes (distances)
    const linkLabel = g.append('g')
      .selectAll<SVGTextElement, Edge>('text')
      .data(edgesCopy)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#64748b')
      .attr('dy', -4)
      .text(d => `${d.distance} km`)

    // Nœuds
    const node = g.append('g')
      .selectAll<SVGGElement, Node>('g')
      .data(nodesCopy)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, Node>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            if (!d.isEntrepot) {
              d.fx = null
              d.fy = null
            }
          })
      )
      .on('click', (_, d) => {
        if (onNodeClick) onNodeClick(d.id)
      })

    // Cercle principal
    node.append('circle')
      .attr('r', d => d.isEntrepot ? 22 : 16)
      .attr('fill', d => {
        if (d.isEntrepot) return '#16a34a'
        if (isOnPath(d.id)) return '#f59e0b'
        return '#3b82f6'
      })
      .attr('stroke', d => {
        if (d.isEntrepot) return '#14532d'
        if (isOnPath(d.id)) return '#d97706'
        return '#1e40af'
      })
      .attr('stroke-width', d => isOnPath(d.id) ? 3 : 2)
      .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))')

    // Icône texte dans le cercle
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', d => d.isEntrepot ? '13px' : '10px')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .text(d => d.isEntrepot ? '⬡' : d.label.charAt(0))

    // Label sous le nœud
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.isEntrepot ? 30 : 24)
      .attr('font-size', '11px')
      .attr('font-weight', d => d.isEntrepot ? '700' : '500')
      .attr('fill', d => d.isEntrepot ? '#15803d' : '#1e40af')
      .text(d => d.label.length > 14 ? d.label.slice(0, 14) + '…' : d.label)

    // Mise à jour positions
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x ?? 0)
        .attr('y1', d => (d.source as Node).y ?? 0)
        .attr('x2', d => (d.target as Node).x ?? 0)
        .attr('y2', d => (d.target as Node).y ?? 0)

      linkLabel
        .attr('x', d => (((d.source as Node).x ?? 0) + ((d.target as Node).x ?? 0)) / 2)
        .attr('y', d => (((d.source as Node).y ?? 0) + ((d.target as Node).y ?? 0)) / 2)

      node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    return () => {
      simulation.stop()
    }
  }, [nodes, edges, height, isOnPath, isEdgeOnPath, onNodeClick])

  return (
    <div style={{ height }} className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="w-full h-full"
      />
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
          Aucun nœud à afficher
        </div>
      )}
      {/* Aide zoom */}
      <div className="absolute bottom-2 right-2 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded-md">
        Molette pour zoomer · Glisser pour déplacer
      </div>
    </div>
  )
}
