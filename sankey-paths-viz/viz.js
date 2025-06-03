function drawViz(data, element) {
  const margin = {top: 10, right: 10, bottom: 10, left: 10};
  const width = element.offsetWidth - margin.left - margin.right;
  const height = element.offsetHeight - margin.top - margin.bottom;

  const svg = d3.select(element)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const stepsByUser = d3.groups(data.tables.DEFAULT, d => d.ConversionID)
    .map(([id, steps]) => {
      return steps.sort((a, b) => new Date(a.TPDatetime) - new Date(b.TPDatetime))
                  .map(s => s.Step);
    });

  const linksMap = new Map();

  stepsByUser.forEach(path => {
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i] + '→' + path[i + 1];
      linksMap.set(key, (linksMap.get(key) || 0) + 1);
    }
  });

  const nodesSet = new Set();
  linksMap.forEach((_, key) => {
    const [source, target] = key.split('→');
    nodesSet.add(source);
    nodesSet.add(target);
  });

  const nodes = Array.from(nodesSet).map(name => ({name}));
  const nodeIndex = new Map(nodes.map((d, i) => [d.name, i]));
  const links = Array.from(linksMap.entries()).map(([key, value]) => {
    const [source, target] = key.split('→');
    return {
      source: nodeIndex.get(source),
      target: nodeIndex.get(target),
      value
    };
  });

  const sankey = d3.sankey()
    .nodeWidth(20)
    .nodePadding(15)
    .extent([[1, 1], [width - 1, height - 6]]);

  const {nodes: layoutNodes, links: layoutLinks} = sankey({nodes: nodes.map(d => ({...d})), links});

  svg.append('g')
    .selectAll('rect')
    .data(layoutNodes)
    .join('rect')
    .attr('x', d => d.x0)
    .attr('y', d => d.y0)
    .attr('height', d => d.y1 - d.y0)
    .attr('width', d => d.x1 - d.x0)
    .attr('fill', '#69b3a2')
    .append('title')
    .text(d => `${d.name}`);

  svg.append('g')
    .attr('fill', 'none')
    .selectAll('path')
    .data(layoutLinks)
    .join('path')
    .attr('d', d3.sankeyLinkHorizontal())
    .attr('stroke', '#aaa')
    .attr('stroke-width', d => Math.max(1, d.width))
    .attr('stroke-opacity', 0.5);

  svg.append('g')
    .style('font', '12px sans-serif')
    .selectAll('text')
    .data(layoutNodes)
    .join('text')
    .attr('x', d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr('y', d => (d.y1 + d.y0) / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
    .text(d => d.name);
}

google.visualization.events.addListener(data, 'ready', function() {
  drawViz(data, document.getElementById('chart'));
});