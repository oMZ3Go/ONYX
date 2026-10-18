# Phase 00 repository inspection

Inspected on 2026-10-18 in `D:\ONYX`, before modifications.

| Item                   | Observed result                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| Git                    | Initialized, unborn `main`, no commits; `git log -1` fails for this expected reason       |
| Remote                 | `origin` fetch/push: `https://github.com/oMZ3Go/ONYX.git`; no remote writes               |
| Initial work           | Two untracked Markdown files and `docs/brand/onyx-brand-reference.jpeg`                   |
| Application            | None: no package manifest, lockfile, source, or tooling config                            |
| Workspace instructions | No applicable AGENTS.md found at drive/workspace level or within existing workspace files |
| Node.js                | `v24.22.0`, `C:\Program Files\nodejs\node.exe`                                            |
| npm                    | `11.19.1` using `npm.cmd`                                                                 |
| Git version            | `2.53.0.windows.2`                                                                        |
| Shell                  | Windows PowerShell; `npm.ps1` blocked by execution policy                                 |

The supplied environment description (Node 25.2.1/npm 11.7.0) is stale. Node 24 is already installed; no runtime installation or execution-policy change is needed. Use `npm.cmd` in PowerShell. Node 24 LTS is the project baseline; developers still on Node 25 should switch explicitly using their preferred installation manager. No system software was changed.

Both original Markdown files were read. The old kickoff restricted work to documents, but the newer master request explicitly authorizes Task F. The JPEG was inspected; it contains existing ONYX hanger/logo treatments and provisional color references, not a complete brand kit. No logo recreation is authorized.

Original SHA-256 hashes, to verify preservation:

```text
00_PROJECT_BRIEF_AR.md
DAAC066A13E83A4F0733FDE94F7E497192599FFE81761C8C51AFF1E75F5EE658
01_CODEX_START_PROMPT.md
57A0431134CE365BCFE5446810799E8DB566F4087E36A321F51A070A948A68EC
docs/brand/onyx-brand-reference.jpeg
8FC000C85005A773BE5A3E3C3353BC0A25FE2CDDE39240C835DDE45A6174DAA6
```

Network note: the sandbox rejected the first npm registry read with `EACCES`. Package metadata was then read through an approved network-capable command. This is a sandbox restriction, not Node incompatibility. Final installation/check outcomes are in [the report](report.md).
