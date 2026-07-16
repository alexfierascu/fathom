import { describe, expect, it } from 'vitest';

import {
  buildMaritimeGraph,
  degree,
  getMaritimeGraph,
  neighbors,
  shortestPath,
  traverse,
} from './graph';

const graph = getMaritimeGraph();

describe('buildMaritimeGraph', () => {
  it('creates nodes for every entity kind with pages', () => {
    expect(graph.nodes.get('strait:gibraltar')?.name).toBe('Strait of Gibraltar');
    expect(graph.nodes.get('water-body:mediterranean-sea')?.type).toBe('water-body');
    expect(graph.nodes.get('country:spain')?.type).toBe('country');
    expect(graph.nodes.get('region:europe')?.type).toBe('region');
    expect(graph.nodes.get('canal:suez-canal')?.type).toBe('canal');
  });

  it('derives connected_to edges from a strait connects line', () => {
    const waters = neighbors(graph, 'strait:gibraltar', { kinds: ['connected_to'] }).map(
      ({ node }) => node.entityId,
    );
    expect(waters).toContain('water-body:atlantic-ocean');
    expect(waters).toContain('water-body:mediterranean-sea');
  });

  it('marks the two waters a strait joins as adjacent', () => {
    const adjacent = neighbors(graph, 'water-body:mediterranean-sea', {
      kinds: ['adjacent_to'],
    }).map(({ node }) => node.entityId);
    expect(adjacent).toContain('water-body:atlantic-ocean');
  });

  it('derives borders and country adjacency from strait shores', () => {
    const shores = neighbors(graph, 'strait:gibraltar', { kinds: ['borders'] }).map(
      ({ node }) => node.entityId,
    );
    expect(shores).toEqual(expect.arrayContaining(['country:spain', 'country:morocco']));
    const neighborsOfSpain = neighbors(graph, 'country:spain', { kinds: ['adjacent_to'] }).map(
      ({ node }) => node.entityId,
    );
    expect(neighborsOfSpain).toContain('country:morocco');
  });

  it('derives crossings, hierarchy, and nearby edges', () => {
    const doverCrossings = neighbors(graph, 'strait:dover', { kinds: ['crosses'] }).map(
      ({ node }) => node.entityId,
    );
    expect(doverCrossings).toContain('tunnel:channel-tunnel');

    const nearby = neighbors(graph, 'strait:bosporus', { kinds: ['nearby'] });
    expect(nearby.length).toBeGreaterThan(0);
    expect(nearby.map(({ node }) => node.entityId)).toContain('strait:dardanelles');
  });

  it('contains no edges to missing nodes', () => {
    for (const [from, edges] of graph.edges) {
      expect(graph.nodes.has(from)).toBe(true);
      for (const edge of edges) {
        expect(graph.nodes.has(edge.to)).toBe(true);
      }
    }
  });

  it('is memoized but rebuildable', () => {
    expect(getMaritimeGraph()).toBe(graph);
    const fresh = buildMaritimeGraph();
    expect(fresh.nodes.size).toBe(graph.nodes.size);
  });
});

describe('traversal', () => {
  it('traverse reports nearest entities first and never repeats', () => {
    const visits = traverse(graph, 'strait:gibraltar', { maxDepth: 2 });
    expect(visits.length).toBeGreaterThan(0);
    const ids = visits.map((visit) => visit.node.entityId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain('strait:gibraltar');
    const depths = visits.map((visit) => visit.depth);
    expect([...depths].sort((a, b) => a - b)).toEqual(depths);
  });

  it('shortestPath finds a water route from Gibraltar to the Bosporus', () => {
    const path = shortestPath(graph, 'strait:gibraltar', 'strait:bosporus', {
      kinds: ['connected_to', 'adjacent_to', 'flows_into', 'contains'],
    });
    expect(path).not.toBeNull();
    expect(path?.[0]).toBe('strait:gibraltar');
    expect(path?.[path.length - 1]).toBe('strait:bosporus');
  });

  it('shortestPath returns null for unknown nodes', () => {
    expect(shortestPath(graph, 'strait:gibraltar', 'strait:atlantis')).toBeNull();
  });

  it('degree reflects connectivity', () => {
    expect(degree(graph, 'strait:gibraltar')).toBeGreaterThan(degree(graph, 'strait:solent'));
  });
});
