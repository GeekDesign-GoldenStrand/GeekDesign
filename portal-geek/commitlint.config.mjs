/**
 * commitlint — enforce Conventional Commits on every commit message.
 * Runs from the commit-msg Husky hook (see .husky/commit-msg).
 */
const config = {
  extends: ["@commitlint/config-conventional"],
};

export default config;
