const SEARXNG_REPO_URI = "https://github.com/cocktailpeanut/searxng.pinokio.git"
const SEARXNG_START_URI = `${SEARXNG_REPO_URI}/start.js`

module.exports = {
  daemon: true,
  run: [
    {
      method: "script.run",
      params: {
        uri: SEARXNG_START_URI
      }
    },
    {
      method: "local.set",
      params: {
        searxng_url: `{{script.local('${SEARXNG_START_URI}').url}}`
      }
    },
    {
      method: "shell.run",
      params: {
        path: "app",
        venv: "env",
        venv_python: "3.12",
        env: {
          "HOST": "127.0.0.1",
          "AUTH_ENABLED": "false",
          "LOCALHOST_BYPASS": "false",
          "ODYSSEUS_LOCAL_USER": "admin",
          "SEARXNG_INSTANCE": "{{local.searxng_url}}",
          "PYTHONPATH": ".."
        },
        shell: "{{which('bash')}}",
        message: [
          "uvicorn pinokio_noauth:app --host 127.0.0.1 --port {{port}}"
        ],
        on: [{
          event: "/(http:\\/\\/[0-9.:]+)/",
          done: true
        }]
      }
    },
    {
      method: "local.set",
      params: {
        url: "{{input.event[1]}}"
      }
    }
  ]
}
