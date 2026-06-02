# Odysseus Pinokio Launcher

This launcher installs and runs [Odysseus](https://github.com/pewdiepie-archdaemon/odysseus), a self-hosted AI workspace with chat, agents, MCP tools, memory, documents, deep research, email/calendar workflows, and model endpoint management.

## Use

1. Click **Install**. Pinokio clones Odysseus into `app`, creates `app/env` with Python 3.12, installs Python dependencies with `uv`, runs `python setup.py`, and installs the SearXNG Pinokio launcher through its repository URI when needed.
2. The launcher starts Odysseus on `127.0.0.1` through a launcher-owned no-auth runtime wrapper. The cloned Odysseus source is not modified for this behavior.
3. Click **Start**. The launcher starts the local SearXNG Pinokio launcher, reads its dynamic URL from Pinokio script locals, passes it to Odysseus as `SEARXNG_INSTANCE`, and starts FastAPI with Uvicorn on `127.0.0.1` using the next available Pinokio port.
4. Click **Open Web UI** after the server URL appears.

Odysseus itself does not require a GPU just to launch. GPU, VRAM, RAM, and disk needs depend on the model server you connect to or the models you choose from the Cookbook. The upstream app includes VRAM-aware model recommendations and supports lower-memory GGUF/AWQ/FP8-style choices through its model workflow, so there is no separate low-VRAM launcher path to install here.

On Linux and Termux, upstream notes that Cookbook background downloads and model serving require `tmux`. Core chat and workspace features can still connect to external model endpoints.

## Maintenance

- **Update** pulls this launcher and the cloned `app`, reinstalls requirements, reruns setup, and updates the SearXNG launcher when Pinokio has it downloaded.
- **Factory Reset** removes `app`, including installed dependencies and local Odysseus data.
- User data, logs, `.env`, databases, uploads, generated images, and cloned app files are ignored by Git.

## API

Odysseus exposes a FastAPI backend under the same URL shown by **Open Web UI**. In Pinokio local-launch mode, the launcher disables Odysseus auth at runtime and stamps requests as the local admin user. Programmatic calls to the Pinokio URL do not need a login cookie.

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

Replace `PORT` with the port displayed by Pinokio after startup.
