export default class EventDispatcher {
  _fire(identifier, payload) {
    this._eventListeners = this._eventListeners || {};
    if (!this._eventListeners[identifier]) return;
    let i;
    for (i = this._eventListeners[identifier].length - 1; i >= 0; i -= 1) {
      const listener = this._eventListeners[identifier][i],
        [once, _name, func] = listener;
      setTimeout(() => func(payload), 0);
      if (once)
        this._eventListeners[identifier].splice(i, 1);
    }
  }

  on(identifier, func, name = undefined) {
    this._eventListeners = this._eventListeners || {};
    this._eventListeners[identifier] = this._eventListeners[identifier] || [];
    this._eventListeners[identifier].push([false, name, func]);
    return this;
  }

  once(identifier, func, name = undefined) {
    this._eventListeners = this._eventListeners || {};
    this._eventListeners[identifier] = this._eventListeners[identifier] || [];
    this._eventListeners[identifier].push([true, name, func]);
    return this;
  }

  off(identifier, funcOff) {
    this._eventListeners = this._eventListeners || {};
    this._eventListeners[identifier] = this._eventListeners[identifier] || [];
    let i;
    for (i = this._eventListeners[identifier].length - 1; i >= 0; i -= 1) {
      const listener = this._eventListeners[identifier][i],
        [_once, name, func] = listener;
      if (func === funcOff || name === funcOff)
        this._eventListeners[identifier].splice(i, 1);
    }
    return this;
  }
}
