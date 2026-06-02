module.exports = {
  daemon: true,
  run: [
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
