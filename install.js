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
      // odysseus-dev releases into this fork later on.
      //
      // `git config` is used instead of `git remote add` on purpose:
      //   - it is idempotent, so re-running the installer replaces the URL
      //     instead of failing with "remote upstream already exists";
      //   - it always exits 0, so a re-install never fails this step;
      //   - it avoids the `||` shell construct, which stalls Pinokio's
      //     shell.run when it follows a failing git command.
      method: "shell.run",
      params: {
        path: "app",
        message: [
          `git config remote.upstream.url ${UPSTREAM_REPO_URI}`,
          "git config remote.upstream.fetch +refs/heads/dev:refs/remotes/upstream/dev",
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
      // setup.py asks for the admin username/password whenever it runs on a
      // TTY, and Pinokio's shell is a TTY, so left alone it blocks the install
      // forever. Generate the password once, keep it on disk, and hand it to
      // setup.py through the environment instead.
      //
      // Everything has to live in ONE message: Pinokio starts a fresh shell
      // for every entry of the message array, so an `export` in one message
      // would not survive into the next one.
      method: "shell.run",
      params: {
        path: "app",
        venv: "env",
        venv_python: "3.12",
        shell: "{{which('bash')}}",
        message: [
          "mkdir -p data; if [ ! -f data/.admin_password ]; then python -c 'import secrets; print(secrets.token_urlsafe(18))' > data/.admin_password; fi; export ODYSSEUS_ADMIN_USER=admin; export ODYSSEUS_ADMIN_PASSWORD=\"$(cat data/.admin_password)\"; echo \"Admin password: $ODYSSEUS_ADMIN_PASSWORD\"; python setup.py"
        ]
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
