# Stop Conditions and Evidence Preservation

The process stops without fallback when an approval is absent, rejected, revoked, stale or narrower than the requested action. It also stops on source-identity mismatch, repository-internal heavy-artifact paths, existing output paths, unsupported runtime resolution, unavailable XPU, silent device fallback, non-finite values, OOM, severe paging, thermal throttling, privacy or license blockers, and projected or elapsed principal-run duration above 60 minutes.

Stopping never authorizes a retry or alternative environment. The process preserves only safe evidence already available: gate identity, timestamps, hashes, status, diagnostics, exit information and deviations. It must not copy source text, secrets, model weights, caches or checkpoints into the repository.

At the current G0-C scope, any attempted environment creation, dependency installation, retrieval, data preparation, inference, baseline, dry validation or training must stop before the action begins.
