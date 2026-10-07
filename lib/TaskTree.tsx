'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Task, TaskStatus } from './types';

interface TaskTreeProps {
  tasks: Record<string, Task>;
}

export const TaskTree: React.FC<TaskTreeProps> = ({ tasks }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || Object.keys(tasks).length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Convert flat tasks to hierarchy
    const rootId = Object.values(tasks).find(t => t.parentId === null)?.id;
    if (!rootId) return;

    const stratify = d3.stratify<Task>()
      .id(d => d.id)
      .parentId(d => d.parentId);

    const root = stratify(Object.values(tasks));

    const treeLayout = d3.tree<Task>().size([width - 100, height - 100]);
    treeLayout(root);

    const g = svg.append('g').attr('transform', 'translate(50, 50)');

    // Links
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkVertical()
        .x((d: any) => d.x)
        .y((d: any) => d.y) as any)
      .attr('fill', 'none')
      .attr('stroke', '#141414')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', (d: any) => d.target.data.status === TaskStatus.PENDING ? '4,4' : '0');

    // Nodes
    const node = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    node.append('circle')
      .attr('r', 6)
      .attr('fill', d => {
        switch (d.data.status) {
          case TaskStatus.COMPLETED: return '#141414';
          case TaskStatus.DECOMPOSING: return '#F27D26';
          case TaskStatus.EXECUTING: return '#00FF00';
          case TaskStatus.FAILED: return '#FF4444';
          default: return '#E4E3E0';
        }
      })
      .attr('stroke', '#141414')
      .attr('stroke-width', 1);

    node.append('text')
      .attr('dy', '.31em')
      .attr('y', d => d.children ? -15 : 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-family', 'var(--f-mono)')
      .text(d => d.data.goal.length > 20 ? d.data.goal.substring(0, 17) + '...' : d.data.goal);

  }, [tasks]);

  return (
    <div className="w-full h-full bg-[#E4E3E0] border border-[#141414] overflow-hidden relative">
      <div className="absolute top-2 left-2 flex gap-4 text-[10px] font-mono uppercase opacity-50">
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#141414]"></div> Completed</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#F27D26]"></div> Decomposing</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#00FF00]"></div> Executing</div>
      </div>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
