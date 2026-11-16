# tkur_jazzerjs 0.1.0

Linux x86-64, Node.js **24.x** JavaScript/TypeScript coverage-guided fuzzing.
Forked Jazzer.js **4.0.0** instrumentation and Node-API addon, linked with a
scoped copy of **tkur_libfuzzer 0.2.0 / LLVM 18.1.8**. No Python, log parser,
external stall watchdog or subprocess fuzz-loop controller is used.

## Install the ready-to-run binary package

```sh
npm install --ignore-scripts --no-audit --no-fund ./tkur_jazzerjs-0.1.0.tgz
npx --no-install tkur_jazzerjs ./target.js corpus -- --new-stall 30 --cov-stall=60
```

The npm tarball includes the compiled Linux x86-64 `.node`, compiled JavaScript
runtime/instrumentation and private upstream dependencies, their licenses and
package metadata. JavaScript runtime files are necessary executable components,
not instructions to compile an addon on install. It has **no install/build
scripts, native/TypeScript source or Python**. All dependencies are bundled;
installation is tested with an empty npm cache and offline networking disabled.
No npm/GitHub publication is performed by the build scripts.

The binary is built on Ubuntu 24.04 amd64, glibc 2.39, libstdc++ and Clang 18.
Older glibc, Windows/macOS, other CPU architectures and Node major versions
other than 24 are not claimed supported. Node-API version 4 is used internally;
that is not a claim that untested Node releases are supported.

## A target

```js
// target.js — CommonJS, export one Buffer-taking function
exports.fuzz = function (data) {
  if (data.length > 1 && data[0] === 65 && data[1] === 66) {
    // call the real library/parser being tested here
  }
};
```

CLI default asynchronous mode supports a returned Promise or a Node-style
`fuzz(data, done)` callback (not both). Select another export with
`--fuzz_entry_point=name`, constrain instrumentation with `-i path/`, and use
`--sync` only for targets that do not return Promises or use done callbacks.
Promise targets are genuinely awaited; native fuzzing never returns while a
callback is pending. `--timeout=5000` is the upstream per-input CLI timeout in
milliseconds; it is translated to libFuzzer seconds. Explicit raw `-timeout=N`
after the outer separator overrides that translated default, preserving native
last-wins precedence.

```sh
mkdir -p corpus
printf A > corpus/seed
npx --no-install tkur_jazzerjs target.js corpus -i /absolute/project/ --timeout=3000 -- --new-stall=10 -print_final_stats=1
```

The outer `--` separates Jazzer.js options from the underlying native engine
arguments. Branded `--new-stall` / `--cov-stall` aliases may also appear before the outer
separator; the CLI only forwards their exact tokens to C++, which validates and
parses them. No timer is implemented by the CLI. Raw `-new_stall=N` / `-cov_stall=N` are equivalent.

### Native stall contract

* Nonnegative decimal int32 seconds; **0 disables** a timer. Missing, signed,
  fractional, malformed and overflowing values fail. Last occurrence wins.
* Both enabled: **either expiry** ends the campaign successfully with exit 0,
  normal DONE/statistics and normal Node asynchronous finalization.
* NEW means a genuinely added feature/corpus NEW event; feature-only NEW at
  constant coverage refreshes it. Corpus minimization **REDUCE does not**.
* Coverage means total observed instrumented sites (`cov:`), **not `ft:`**.
  JavaScript synthetic PC-table entries identify actually executed instrumented
  JS sites; these are not machine instruction addresses or source-line coverage.
* Timers use `std::chrono::steady_clock` and start **after initial corpus
  execution**. They are checked between callbacks/mutation-depth iterations.
  They cannot interrupt a hung JS callback/Promise. Use the separate native
  per-input timeout to fail that case and save a timeout artifact.
* Exceptions/rejections, native crashes and per-input timeouts remain nonzero
  failures with crash/timeout artifacts. No failure is converted to stall success.
* Native custom mutator/crossover hooks retain upstream libFuzzer behavior;
  Linux `LD_PRELOAD=/path/mutator.so` is tested. The mutator is compiled native
  code, not a JS custom-mutator API. A hook must obey libFuzzer buffer contracts.
* One native fuzz session per process. Repeated, concurrent or recursive starts
  are rejected before native global state is overwritten. Fork mode with stall
  timers is unsupported. Do not load another libFuzzer/sanitizer runtime into
  the same process; sanitizer symbol interposition is not supported.
* Done callbacks must settle exactly once. A callback+Promise or synchronous
  duplicate is rejected. A late duplicate after an input has completed is an
  uncaught asynchronous target error, not a valid extra input result; its stack
  is reported but current-input artifact attribution cannot be guaranteed.
  Targets must not retain inputs or start work that outlives their completion.

For a programmatic Promise runner use `require('tkur_jazzerjs').fuzzer`;
`startFuzzingAsync(target, ['tkur_jazzerjs', ...nativeArgs])` returns a Promise
that settles only after the native worker has returned and been joined.
The raw private addon deliberately rejects done-callback functions: use the
branded JS API, whose callback state is heap-owned and cannot outlive native
stack storage. `stallAbiVersion` and `compatibilityVersion` both equal **1**.

## Real TypeScript compilation and source maps

There is **no pretend runtime TypeScript support**. Compile the target first:

```sh
npm install --save-dev --ignore-scripts typescript@5.9.3
npx tsc -p examples/typescript/tsconfig.json
npx --no-install tkur_jazzerjs build/examples/typescript/target.js corpus -- --cov-stall=10
```

The example config emits CommonJS ES2022, source maps and inline original TS
source content. Fuzzing instruments emitted JavaScript. Source-map-aware replay
can map an independent coverage report back to actual TS lines; fuzz-engine
`cov:` alone is not a source coverage report. Independent coverage production
and native report rendering are separate components, not a subprocess watchdog.

## Developer build (source checkout only)

Requirements: Linux amd64; Node **24.22.3** + npm **11.19.1**, Node development
headers, CMake >=3.22, Ninja, Clang/LLVM **18**, libstdc++, POSIX threads, npm
registry access for the pinned runtime lock (not needed to install the binary).

```sh
node scripts/prepare-runtime.mjs
cmake -S . -B build/native -G Ninja -DCMAKE_CXX_COMPILER=clang++-18 \
  -DNODE_INCLUDE_DIR=/your/node/include/node
cmake --build build/native -j4
node scripts/stage-addon.mjs
node tests/probe.cjs
node tests/regressions.cjs
node scripts/package-runtime.mjs
```

The checked-in native sources are final build inputs. No LLVM source download,
`CUSTOM_LIBFUZZER_PATH`, Python generator or on-install compiler is used.
`UPSTREAM.md`, source hashes and compatibility diffs record provenance.
