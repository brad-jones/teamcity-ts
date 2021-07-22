export interface CustomSshKeyAuthMethod {
  /**
   * Supported only for server-side checkout.
   *
   * When this method is used, fill the Private Key Path field with an absolute
   * path to the private key file on the server machine. If required, specify
   * the passphrase to access your SSH key in the corresponding field.
   */
  type: "PRIVATE_KEY_FILE";

  /**
   * Specify the username if there is no username in the clone URL.
   * The username specified here overrides the username from the URL.
   */
  username?: string;

  /**
   * Specify the path to the private key on the TeamCity server host.
   */
  path: string;

  /**
   * An optional passphrase to upload the custom key.
   *
   * > HINT: If you really truly do not want to use a `credentialsJSON` pointer
   * > here, instead preferring a password parameter you can still do that but
   * > you will have to cast the string. This is hard on purpose, you should
   * > always prefer `credentialsJSON` over a parameter with a password spec.
   */
  passphrase?: `credentialsJSON:${string}`;
}
