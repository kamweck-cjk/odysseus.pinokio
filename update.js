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
      method: "shell.run",
      params: {
        path: "app",
        message: "git pull"
      }
    },
    {
      method: "shell.run",
      params: {
        path: "app",
        venv: "env",
        venv_python: "3.12",
        message: [
          "uv pip install -r requirements.txt",
          "python setup.py"
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
