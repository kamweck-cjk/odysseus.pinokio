const APP_REPO_URI = "https://github.com/kamweck-cjk/odysseus.git"
const UPSTREAM_REPO_URI = "https://github.com/odysseus-dev/odysseus.git"

// "Sync with Upstream" pulls new releases from odysseus-dev/odysseus into this
// fork and pushes the result back to kamweck-cjk/odysseus. This is the
// mechanism that keeps the fork tracking the main app while keeping the local
// low-GPU feature commits on top.
//
// If the merge conflicts, git leaves app/.git/MERGE_HEAD behind and the push
// is skipped, so the fork is never overwritten with a broken merge. Resolve
// the conflict inside the app folder and run this script again.
module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        path: "app",
        message: [
          `git remote get-url upstream || git remote add upstream ${UPSTREAM_REPO_URI}`,
          "git fetch upstream dev",
          "git merge --no-edit upstream/dev"
        ]
      }
    },
    {
      when: "{{!exists('app/.git/MERGE_HEAD')}}",
      method: "shell.run",
      params: {
        path: "app",
        message: "git push origin dev"
      }
    }
  ]
}
