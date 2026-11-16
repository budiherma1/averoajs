import { Gate } from '@averoa/utilities';

/**
 * Authorization setup: model policies and abilities of the application Gate
 * (@averoa/utilities). Registered once, when app/Providers/index.js is loaded
 * at startup, so Gate checks and can() middleware work everywhere.
 */
class AuthProvider {
  constructor() {
    this.registered = false;
  }

  /**
   * [model class -> policy class]
   *
   * @return  {[array]}  [list of [Model, Policy] pairs]
   */
  policies() {
    // node averoa make:policy PostPolicy, then:
    //   import { Post } from '#models';
    //   import PostPolicy from '#app/Policies/PostPolicy.js';
    //   return [[Post, PostPolicy]];
    return [];
  }

  /**
   * [abilities that are not about one model]
   *
   * @param   {[object]}  gate  [the Gate]
   *
   * @return  {[void]}
   */
  abilities(gate) {
    gate.define('admin', (user) => user.isAdmin?.() === true);
  }

  register(gate = Gate) {
    if (this.registered) return gate;
    for (const [Model, Policy] of this.policies()) gate.policy(Model, Policy);
    this.abilities(gate);
    this.registered = true;
    return gate;
  }
}

const provider = new AuthProvider();
provider.register();

export default provider;
