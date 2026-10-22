# Dolphin — Pinokio Launcher

> A leaping dolphin emblem in the *Skies of Arcadia* ocean palette. The app itself is still called **Odysseus** underneath — see [Branding](#branding).

Installs and runs [Odysseus](https://github.com/kamweck-cjk/odysseus), a self-hosted AI workspace with chat, agents, MCP tools, memory, documents, deep research, email/calendar workflows, and model endpoint management.

This is a **fork** of the upstream Odysseus project ([`odysseus-dev/odysseus`](https://github.com/odysseus-dev/odysseus)) with one additive feature that upstream does not have:

> **Low-resource profile** — the app detects the machine's VRAM/RAM at startup and derives a resource tier from it. On a weak box, requests to *local* model servers are clamped to a context window and output budget the hardware can actually hold, and the optional in-process GPU features (TTS, STT, neural upscaling) stay off the GPU so they do not steal VRAM from the model you are actually chatting with.

On a capable machine the tier is `standard`, which means **no limits** — the fork behaves exactly like upstream. Every clamp applies only to `localhost`/LAN model servers; requests to OpenAI, Anthropic, or any hosted API are never touched.

---

## Use

1. Click **Install**. Pinokio clones the fork into `app`, wires the upstream repository in as a second git remote, creates `app/env` with Python 3.12, installs Python dependencies with `uv`, runs `python setup.py`, and installs the SearXNG Pinokio launcher through its repository URI when needed.
2. Click **Start**. The launcher starts the local SearXNG Pinokio launcher, reads its dynamic URL from Pinokio script locals, passes it to Odysseus as `SEARXNG_INSTANCE`, and starts FastAPI with Uvicorn on `127.0.0.1` using the next available Pinokio port.
3. Click **Open Web UI** after the server URL appears.

Odysseus itself does not require a GPU just to launch. GPU, VRAM, RAM, and disk needs depend on the model server you connect to or the models you choose from the Cookbook.

On Linux and Termux, upstream notes that Cookbook background downloads and model serving require `tmux`. Core chat and workspace features can still connect to external model endpoints.

---

## The low-resource feature

### How the tier is chosen

At startup the app probes the box (`nvidia-smi` on NVIDIA, the platform equivalent otherwise) and derives a tier. The probe runs on a background thread — it never delays startup and never sits on the request path.

| Tier | When | Local context cap | Local output cap | History messages | GPU features |
|---|---|---|---|---|---|
| `minimal` | No usable GPU, or VRAM < 3 GB, or RAM < 4 GB | 2,048 | 1,024 | 12 | off |
| `low` | VRAM < 6 GB | 4,096 | 2,048 | 24 | on |
| `medium` | VRAM < 10 GB | 8,192 | 4,096 | 45 | on |
| `standard` | VRAM ≥ 10 GB and RAM ≥ 8 GB | none | none | none | on |

`standard` is the "no limits" tier, so the feature is a no-op on a roomy machine.

### Overriding the tier

The tier belongs to the *machine*, not to a user, so it is stored machine-wide in `app/data/low_resource_profile.json` and shared by every user of the install. Two ways to override it:

- **API** (admin only) — `POST /api/lowgpu/profile` with `{"tier": "low"}`. Use `{"tier": "auto"}` to clear the override and go back to detecting from the hardware.
- **Environment variable** — `ODYSSEUS_LOW_RESOURCE_TIER=minimal|low|medium|standard` overrides everything, including a stored override. Useful for containers and remote machines where the detected GPU is not the one in use.

Until the background probe finishes, nothing is clamped: an undetermined machine keeps the behaviour it shipped with, because a wrong clamp is worse than no clamp.

---

## Maintenance

| Menu item | What it does |
|---|---|
| **Update** | Pulls this launcher and the cloned `app` from `kamweck-cjk`, reinstalls requirements, reruns setup, and updates the SearXNG launcher when Pinokio has it downloaded. |
| **Sync with Upstream** | Fetches `upstream/dev` from `odysseus-dev/odysseus`, merges it into the fork's `dev` branch, and pushes the result back to `kamweck-cjk/odysseus`. This is how the fork keeps tracking the main app while keeping the low-GPU commits on top. |
| **Install** | Re-runs the install flow (clone if missing, dependencies, setup). |
| **Factory Reset** | Removes `app`, including installed dependencies and local Odysseus data. |

If **Sync with Upstream** hits a merge conflict, git leaves `app/.git/MERGE_HEAD` behind and the push is skipped, so the fork is never overwritten with a broken merge. Resolve the conflict inside the `app` folder and run the script again.

User data, logs, `.env`, databases, uploads, generated images, and cloned app files are ignored by Git.

---

## API

The backend exposes a FastAPI server under the same URL shown by **Open Web UI**. In Pinokio local-launch mode, the launcher disables Odysseus auth at runtime and stamps requests as the local admin user. Programmatic calls to the Pinokio URL do not need a login cookie.

Replace `PORT` with the port displayed by Pinokio after startup.

### Low-resource profile

Read the active profile and its limits:

JavaScript:

```js
const baseUrl = "http://127.0.0.1:PORT";
const { profile } = await (await fetch(`${baseUrl}/api/lowgpu/profile`)).json();
console.log(profile.tier, profile.limits);
// e.g. "medium" { context_window_cap: 8192, max_tokens_cap: 4096, ... }
```

Python:

```python
import requests

base_url = "http://127.0.0.1:PORT"
response = requests.get(f"{base_url}/api/lowgpu/profile", timeout=30)
print(response.json()["profile"]["tier"])
```

Curl:

```bash
curl http://127.0.0.1:PORT/api/lowgpu/profile
```

The full limit table for every tier:

```bash
curl http://127.0.0.1:PORT/api/lowgpu/tiers
```

Pin a tier (admin only), or hand control back to detection:

```bash
curl -X POST http://127.0.0.1:PORT/api/lowgpu/profile \
  -H "Content-Type: application/json" \
  -d '{"tier":"minimal"}'

curl -X POST http://127.0.0.1:PORT/api/lowgpu/profile \
  -H "Content-Type: application/json" \
  -d '{"tier":"auto"}'
```

Re-run the hardware probe on demand instead of using the cached result:

```bash
curl "http://127.0.0.1:PORT/api/lowgpu/profile?fresh=true"
```

### Models and workspace

List the configured model endpoints:

JavaScript:

```js
const baseUrl = "http://127.0.0.1:PORT";
const response = await fetch(`${baseUrl}/api/models`);
console.log(await response.json());
```

Python:

```python
import requests

base_url = "http://127.0.0.1:PORT"
response = requests.get(f"{base_url}/api/models", timeout=30)
print(response.json())
```

Curl:

```bash
curl http://127.0.0.1:PORT/api/models
```

---

## Repositories

| Repository | Role |
|---|---|
| [`kamweck-cjk/odysseus`](https://github.com/kamweck-cjk/odysseus) | The app fork (branch `dev`). This is what the launcher clones. |
| [`kamweck-cjk/odysseus.pinokio`](https://github.com/kamweck-cjk/odysseus.pinokio) | This launcher (branch `main`). |
| [`odysseus-dev/odysseus`](https://github.com/odysseus-dev/odysseus) | Upstream. Wired into the app clone as the `upstream` remote and merged in by **Sync with Upstream**. |

The app fork is AGPL-3.0, as upstream is.

---

## Branding

**Dolphin** is the launcher/product name — it is what Pinokio shows in the sidebar, and it is the name of this repository's icon. The name comes from the dolphin emblem of *Skies of Arcadia* (Sega / Overworks, 2000), whose stylised leaping dolphin over a blue ocean is the visual reference for the icon's palette and pose.

Deliberately **not** renamed:

- The application code still identifies itself as `Odysseus` — HTTP headers (`X-Odysseus-*`), environment variables, database and settings keys, the TOTP issuer, and the web UI wordmark.
- The git repositories keep their `odysseus` names.

The reason is upstream sync: **Sync with Upstream** merges `odysseus-dev/odysseus@dev` into this fork on a recurring basis. Renaming internal identifiers would turn every upstream merge into a conflict, and renaming the repositories would break the remote wiring the sync script depends on. The Dolphin name therefore lives at the launcher layer, where it is what a user actually sees.

### Icon artwork

`icon.jpg` (512×512) is original artwork produced for this fork: a public-domain/CC0 dolphin silhouette ([Wikimedia Commons — *Dolphin silhouette 2*](https://commons.wikimedia.org/wiki/File:Dolphin_silhouette_2.png), CC0 1.0) rotated into a leaping pose, recoloured with a *Skies of Arcadia* ocean gradient (vivid blue → cyan over deep ocean), and composited over sea swells.

No Sega/Overworks artwork or wordmark is included. *Skies of Arcadia* and its dolphin emblem remain the property of Sega/Overworks — this icon is a fan-made homage, which is fine for personal use but should not be redistributed as an official product asset.
