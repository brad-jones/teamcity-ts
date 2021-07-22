export interface DefaultSshKeyAuthMethod {
  /**
   * Uses the keys available on the file system in the default locations used
   * by common ssh tools.
   *
   * The mapping specified in <USER_HOME>/.ssh/config if the file exists or
   * the private key file <USER_HOME>/.ssh/id_rsa.
   *
   * The files are required to be present on the server and
   * also on the agent if the agent-side checkout is used.
   */
  type: "PRIVATE_KEY_DEFAULT";

  /**
   * Specify the username if there is no username in the clone URL.
   * The username specified here overrides the username from the URL.
   */
  username?: string;
}
