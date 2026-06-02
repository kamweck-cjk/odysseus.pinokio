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
    }
  ]
}
