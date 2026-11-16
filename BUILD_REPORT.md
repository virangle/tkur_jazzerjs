# tkur_jazzerjs engineering verification

## Frozen binary

* `artifacts/tkur_jazzerjs-0.1.0.tgz`
* SHA256 **7b2b59f6575f6827d2d6fc31a608bc489034d4cd05f99893f6a1016a8d54c01c**
* Native addon SHA256 **70c28b06c19c8321787d37c2d59e6c040b41069cb8b2cde4d9cc60eee91611b5**
* Build: Ubuntu24.04 Linux amd64, glibc2.39; Clang18.1.3; Node24.22.3/npm11.19.1;
  upstream Jazzer.js4.0.0 commit f3eb99cb0ea20fe45356535b1f60f86741974e72.
* 82 installed runtime package entries (80 names listed by npm pack), 1941 files
  in npm tarball, approximately3.5MB compressed. Only one `.node` platform binary.
* No native/TS/Python source, source maps or package scripts in staged executable
  dependencies. Developer CMake/header/npm build tooling pruned from runtime.

## Passed actual execution

`tests/regressions.cjs`: **12/12 PASS**, machine-readable output
`build/regressions/results.json`, per-case complete output in sibling directories.

| Case | Exit | Evidence |
|---|---:|---|
| native NEW stall1 | 0 | native stopping reason + DONE |
| native coverage stall1 | 0 | native stopping reason + DONE |
| either enabled timer expires | 0 | coverage1 wins over NEW5 |
| both zero disabled | 0 | runs30 reaches DONE |
| mixed alias/raw last-wins | 0 | NEW1 overrides earlier0 |
| negative | 1 | native int32 rejection |
| overflow | 1 | native int32 rejection |
| fraction | 1 | native int32 rejection |
| thrown JS Error | 77 | intentional message + crash artifact |
| non-Error rejection | 77 | normalized message + crash artifact |
| awaited Promise target | 0 | coverage stall after completed callbacks |
| never-settling Promise | 70 | actual native per-input ALARM + timeout artifact |

Additional verification:

* `tests/probe.cjs` reports strong stall ABI1 and added Jazzer compatibility ABI1.
* `tests/api-unit.cjs`: successful sync/deferred done, synchronous duplicate,
  done+Promise contract rejection, false/null/undefined/0/string rejection values.
* Separate native `LD_PRELOAD` custom mutator recognized by libFuzzer and actually
  called; `build/custom-mutator.log` shows `Custom-` NEW and cov5→9, DONE100.
* TypeScript5.9.3 compiled actual TS target to JS+map+inlineSources;
  `build/typescript-fuzz.log` shows actual native JS coverage5 and DONE100.
  Stronger packaged-CLI campaign `build/typescript-packaged-stall.log` runs
  without a finite run limit: cov5→11, NEW4, REDUCE4, native coverage-stall1,
  DONE5597 in1second and clean0. QA independently reproduced strict TS fuzzing.
* CMake configure hash-verifies all final native source files.
* Scoped compatibility diff reviewed: no stall-accounting changes. Canonical
  timer header SHA256 **1ff5bb26b3bcbea1356c8a055cf47430c5f8995c6e61a2205f946008c4e42f86**
  byte-identical. Shared canonical backend not edited.
* `tests/package-audit.cjs`: 1948 staged dependency files, one addon, zero
  prohibited source extensions or nonempty package script fields.
* Independent fresh build directory `build/standalone-verify` configures with
  default separate developer-header path and compiles all33 steps successfully,
  using only checked-in native sources and hash manifest, no research inputs.
* Empty-project/empty-cache installation using `npm install --offline
  --ignore-scripts --no-audit --no-fund --cache build/empty-cache-fixed
  artifacts/tkur_jazzerjs-0.1.0.tgz` succeeds; relocated installed CLI loads all
  runtime dependencies and native addon, runs target30 iterations cov5, exits0.
  npm took about2minutes writing the Windows-mounted filesystem, not compiling.

## Independent QA coordination

Managed QA independently verified the earlier critical adapter-contract failure
(double done and done+Promise had exit77 but missing artifact/diagnostic). That
was corrected before this freeze: the JS adapter now prints/dumps the still-active
native input before rejecting and unwinding -2. Independent QA retested both
and reported PASS diagnostic+artifact+77. They also demonstrated controlled
feature-only NEW (ft1→5, cov1) vs actual site growth (cov1→4) distinction.
Independent QA also found a release-blocking replay false-success in the first
candidate: upstream individual-file driver `exit(0)` bypassed Node's Promise
finalizer. That candidate is superseded. The frozen addon above returns to the
embedding caller for individual-file mode and stops replay iterations on -2.
`tests/replay.cjs` now independently exercises async/sync binary finding replay
(exit77) and async/sync normal replay (exit0): **4/4 PASS**. The source hashes
and compatibility diff include this fifth changed engine file.
Final relocated-archive QA is tracked by the Lead separately.

## Important limitations

* Linuxamd64/Node24 only; native runtime is not a stock runtime fallback.
* Native custom mutators, not a newly invented JS custom-mutator API.
* One fuzz session per process; recursive/repeated/concurrent starts rejected.
* Supported lifecycle workflows are fuzz campaigns and individual-file replay.
  Merge, crash minimization, cleanse, fork and subprocess job modes are not
  validated/supported branded JS workflows; some stock upstream driver branches
  still terminate the process instead of settling an embedding Promise. Do not
  infer those workflows are supported from raw libFuzzer help.
* Pending/hung callback cannot be ended by a stall timer. Independent native
  per-input timeout intentionally remains a failure with artifact and nonzero.
* Target work must not outlive callback/Promise completion. Late duplicate done
  is an asynchronous uncaught target error; attribution to its original input is
  not guaranteed. No stack-owned callback pointers remain in the adapter.
* `cov:` counts executed synthetic JS instrumented-site PC-table entries, not
  physical native PCs and not source-line coverage. TS reports require genuine
  source-map-aware independent replay, handled by the managed coverage component.
* Upstream cosmetic circular-import and missing sanitizer callback warnings remain
  in normal logs; strong probes and active artifact callback do not depend on
  those weak symbol lookups. Symbol interposition with another sanitizer runtime
  in the same Node process is unsupported.

No publishing, credentials, Docker recreation or canonical backend edit occurred.
