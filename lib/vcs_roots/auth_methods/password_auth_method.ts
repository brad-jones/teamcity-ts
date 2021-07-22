export interface PasswordAuthMethod {
  /**
   * Specify a valid username (if there is no username in the clone URL; the
   * username specified here overrides the username from the URL) and a password
   * to be used to clone the repository.
   *
   * For the agent-side checkout, it is supported only if Git 1.7.3+ client is
   * installed on the agent. See TW-18711.
   *
   * For Git hosted from Team Foundation Server 2013, specify NTLM credentials here.
   *
   * You can use a personal access token instead of a password to authenticate
   * in GitHub, Azure DevOps Services, GitLab, and Bitbucket.
   *
   * Note that TeamCity does not support token authentication to hosted
   * Azure DevOps Server (formerly, Team Foundation Server) installations.
   *
   * Beginning August 13, 2021, GitHub will no longer accept passwords when
   * authenticating Git operations on GitHub.com. We highly recommend that you
   * use an access token or SSH key instead of password when configuring a
   * VCS root for a GitHub.com repository.
   */
  type: "PASSWORD";

  /**
   * Specify the username if there is no username in the clone URL.
   * The username specified here overrides the username from the URL.
   */
  username?: string;

  /**
   * This can be a password or a bearer token.
   *
   * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
   * > here, instead preferring a password parameter you can still do that but
   * > you will have to cast the string. This is hard on purpose, you should
   * > always prefer `credentialsJSON` over a parameter with a password spec.
   */
  secret: `credentialsJSON:${string}`;
}
