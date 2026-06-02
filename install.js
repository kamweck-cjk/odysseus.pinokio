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
          "git clone https://github.com/pewdiepie-archdaemon/odysseus.git app"
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
