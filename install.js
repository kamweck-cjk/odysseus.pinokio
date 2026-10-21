const APP_REPO_URI = "https://github.com/kamweck-cjk/odysseus.git"
const UPSTREAM_REPO_URI = "https://github.com/odysseus-dev/odysseus.git"
const SEARXNG_REPO_URI = "https://github.com/cocktailpeanut/searxng.pinokio.git"
const SEARXNG_INSTALL_URI = `${SEARXNG_REPO_URI}/install.js`

module.exports = {
  requires: {
    bundle: "ai"
  },
  run: [
    {
      when: "{{!exists('app')}}",
      method: "shell.run",
      params: {
        message: [
          `git clone ${APP_REPO_URI} app`
        ]
      }
    },
    {
      // Wire the upstream remote so that "Sync with Upstream" can merge new
      // odysseus-dev releases into this fork later on. `git remote get-url`
      // exits non-zero when the remote is missing, so the `||` branch adds it.
      method: "shell.run",
      params: {
        path: "app",
        message: [
          `git remote get-url upstream || git remote add upstream ${UPSTREAM_REPO_URI}`,
          "git fetch upstream dev"
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
      method: "shell.run",
      params: {
        path: "app",
        venv: "env",
        venv_python: "3.12",
        input: true,
        message: [
          "python setup.py"
        ],
        onprompt: (shell) => {
          shell.kill("Done")
        }
      }
    },
    {
      when: `{{!script.exists('${SEARXNG_REPO_URI}', 'app', 'env')}}`,
      method: "script.run",
      params: {
        uri: SEARXNG_INSTALL_URI
      }
    }
  ]
}
