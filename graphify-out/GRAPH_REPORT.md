# Graph Report - alura-llama-factory  (2026-08-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 27 nodes · 33 edges · 10 communities (7 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bb7dc6b5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5

## God Nodes (most connected - your core abstractions)
1. `Get-NormalizedPriority()` - 4 edges
2. `Get-SortedExtensionIds()` - 4 edges
3. `Resolve-TemplateContent()` - 4 edges
4. `Get-RepoRoot()` - 4 edges
5. `Get-FeaturePathsEnv()` - 4 edges
6. `Resolve-Template()` - 3 edges
7. `ConvertTo-CleanBranchName()` - 2 edges
8. `Get-BranchName()` - 2 edges
9. `Format-SpecKitCommand()` - 2 edges
10. `Get-InvokeSeparator()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Get-FeaturePathsEnv()` --calls--> `Get-RepoRoot()`  [EXTRACTED]
  .specify/scripts/powershell/common.ps1 → .specify/scripts/powershell/common.ps1  _Bridges community 3 → community 4_

## Import Cycles
- None detected.

## Communities (10 total, 3 thin omitted)

### Community 2 - "Community 2"
Cohesion: 0.60
Nodes (5): Get-NormalizedPriority(), Get-Python3Command(), Get-SortedExtensionIds(), Resolve-Template(), Resolve-TemplateContent()

### Community 3 - "Community 3"
Cohesion: 0.67
Nodes (3): Find-SpecifyRoot(), Get-RepoRoot(), Resolve-SpecifyInitDir()

### Community 4 - "Community 4"
Cohesion: 0.67
Nodes (3): Get-CurrentBranch(), Get-FeaturePathsEnv(), Save-FeatureJson()

## Knowledge Gaps
- **1 isolated node(s):** `alura-llama-factory`
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Get-RepoRoot()` connect `Community 3` to `Community 1`, `Community 4`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `Get-FeaturePathsEnv()` connect `Community 4` to `Community 1`, `Community 3`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `Resolve-TemplateContent()` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `alura-llama-factory` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._