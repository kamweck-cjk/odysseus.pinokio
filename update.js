const APP_REPO_URI = "https://github.com/kamweck-cjk/odysseus.git"
const UPSTREAM_REPO_URI = "https://github.com/odysseus-dev/odysseus.git"
const SEARXNG_REPO_URI = "https://github.com/cocktailpeanut/searxng.pinokio.git"
const SEARXNG_UPDATE_URI = `${SEARXNG_REPO_URI}/update.js`

module.exports = {
  requires: {
    bundle: "ai"
  },
  run: [
    {
      method: "shell.run",
      params: {
        message: "git pull"
      }
    },
    {
      // Make sure the upstream remote points at the canonical repo. `git
      // config` is idempotent and always exits 0, unlike `git remote add`,
      // which fails once the remote already exists. The `||` shell construct
      // is avoided deliberately: it stalls Pinokio's shell.run when it
      // follows a failing git command.
      method: "shell.run",
      params: {
        path: "app",
        message: [
          `git config remote.upstream.url ${UPSTREAM_REPO_URI}`,
          "git config remote.upstream.fetch +refs/heads/dev:refs/remotes/upstream/dev",
          "git pull"
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        path: "app",
        venv: "env",
        venv_python: "3.12",
        message: [
          "uv pip install -r requirements.txt"
        ]
      }
    },
    {
      // Same guard as install.js: setup.py must never block on the
      // interactive admin prompt. One message, because Pinokio starts a fresh
      // shell for every entry of the message array.
      method: "shell.run",
      params: {
        path: "app",
        venv: "env",
        venv_python: "3.12",
        shell: "{{which('bash')}}",
        message: [
          "mkdir -p data; if [ ! -f data/.admin_password ]; then python -c 'import secrets; print(secrets.token_urlsafe(18))' > data/.admin_password; fi; export ODYSSEUS_ADMIN_USER=admin; export ODYSSEUS_ADMIN_PASSWORD=\"$(cat data/.admin_password)\"; python setup.py"
        ]
      }
    },
    {
      when: `{{script.exists('${SEARXNG_REPO_URI}', 'update.js')}}`,
      method: "script.run",
      params: {
        uri: SEARXNG_UPDATE_URI
      }
    }
  ]
}
