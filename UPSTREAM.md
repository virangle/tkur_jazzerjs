# Attribution, exact pins and changes

## Jazzer.js

* Upstream: https://github.com/CodeIntelligenceTesting/jazzer.js
* npm `@jazzer.js/core`, `@jazzer.js/fuzzer`, `@jazzer.js/instrumentor`,
  `@jazzer.js/hooking`, `@jazzer.js/bug-detectors`: **4.0.0**.
* Exact npm gitHead/source commit: **f3eb99cb0ea20fe45356535b1f60f86741974e72**.
* Source archive URL: https://codeload.github.com/CodeIntelligenceTesting/jazzer.js/tar.gz/f3eb99cb0ea20fe45356535b1f60f86741974e72
* Archive SHA256: `2c8c23ffb3d12ae3d0171ed6ee15c51a4ab0a0b5bf53d9474819877368eb3900`.
* npm fuzzer tarball SHA256: `6769fed393cc618e09b2c9c62acb667ce869edff994b6d76980d5018b4989299`.
* Apache-2.0; original Code Intelligence copyright headers retained. Full license
  in `licenses/LICENSE.JAZZERJS.txt` and original dependency notices retained.
* Source/npm metadata researched directly on 2026-11-16. The metadata's engines
  permit Node >=14, but upstream published this pin with Node24.14.1. This fork
  actually builds/tests Node24.22.3, not that entire historical compatibility range.

Pinned upstream CMake builds CodeIntelligenceTesting/llvm-project-jazzer tag
`2023-04-25`, archive SHA256
`200b32c897b1171824462706f577d7f1d6175da602eccfe570d2dceeac11d490`,
whole-archives no_main, and sets NAPI_VERSION=4. It does NOT expose a
CUSTOM_LIBFUZZER_PATH switch or require LLVM22. That CMake is replaced here.

Changes: branded npm wrapper/CLI; native one-session guard and strong capability
probes; Promise-only native async boundary with shared heap input ownership;
Node-style done adapters in JavaScript; no setjmp/longjmp signal handlers;
normal native crash/interrupt handling; falsy/non-Error rejection normalization;
explicit rejection of Promise results in sync mode. Native Promise errors are
retained until the worker has returned, then finalizer joins and settles the
outer Promise. Native async callback is never abandoned on stall success.

## tkur_libfuzzer / LLVM

* Scoped copy of the existing published **tkur_libfuzzer 0.2.0** source checkout.
* LLVM **18.1.8**, upstream provenance carried in `licenses/UPSTREAM.LIBFUZZER.md`.
* Apache-2.0 WITH LLVM-exception, `licenses/LICENSE.LLVM.txt`.
* `native/engine/TkurStallTimer.h` is byte-identical to the canonical backend.
* `native-compatibility.diff` records all scoped native engine differences:
  CI-style callback -2 requests clean return (distinct from rejection -1),
  including early initial-corpus exit; PrintCrashingInput callback assignment;
  stable explicit-ID comparison hooks; compatibility ABI1 probe;
  asynchronous Node-compatible per-input SIGALRM handling with lock-free atomic
  active-input monotonic timestamp and atomic RunningUserCallback flag.
  The native NEW/REDUCE/coverage stall accounting is not rewritten.
* No shared canonical backend file was modified. Weak native mutator hooks are
  preserved and tested using a separately compiled LD_PRELOAD library.

`native-sources.sha256` authenticates all final vendored native build inputs.
`runtime-lock.json` pins every installed executable JS dependency to integrity
hashes. `licenses/DEPENDENCIES.json` records package/version/license metadata;
original dependency license/notice files accompany the binary runtime.

No credentials, publishing action or container recreation is used by this repo.
