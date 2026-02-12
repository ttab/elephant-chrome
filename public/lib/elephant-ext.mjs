import * as Y from './yjs.mjs'

/**
 * A single collaboration session managing a Y.Doc replica.
 * Created by ElephantExt.openCollab(uuid).
 */
export class CollabSession extends EventTarget {
  constructor(uuid) {
    super()
    this.uuid = uuid
    this.doc = new Y.Doc()
    this.synced = false
    this.awarenessStates = []
    this._relayCleanup = null
  }

  _onSynced(update, postToHost) {
    Y.applyUpdate(this.doc, new Uint8Array(update), 'host')
    this.synced = true

    const uuid = this.uuid
    const onUpdate = (u, origin) => {
      if (origin === 'host') return
      postToHost({
        type: 'collab_update',
        payload: { uuid, update: Array.from(u) }
      })
    }
    this.doc.on('update', onUpdate)
    this._relayCleanup = () => this.doc.off('update', onUpdate)

    this.dispatchEvent(new CustomEvent('synced', { detail: { doc: this.doc } }))
  }

  _onUpdate(update) {
    Y.applyUpdate(this.doc, new Uint8Array(update), 'host')
    this.dispatchEvent(new CustomEvent('update', { detail: { doc: this.doc } }))
  }

  _onAwareness(states) {
    this.awarenessStates = states || []
    this.dispatchEvent(new CustomEvent('awareness', { detail: { states: this.awarenessStates } }))
  }

  _onError(error) {
    this.dispatchEvent(new CustomEvent('error', { detail: { error } }))
  }

  _destroy() {
    if (this._relayCleanup) {
      this._relayCleanup()
      this._relayCleanup = null
    }
  }
}

/**
 * Extension-side client for the Elephant Chrome iframe extension protocol.
 *
 * Usage:
 *   const ext = new ElephantExt({ title: 'My Extension', buttons: [...] })
 *   ext.addEventListener('token', (e) => { ... })
 *   ext.addEventListener('services', (e) => { ... })
 *   ext.addEventListener('button', (e) => { ... })
 *   const session = ext.openCollab(uuid)
 *   session.addEventListener('synced', (e) => { ... })
 */
export class ElephantExt extends EventTarget {
  constructor({ title, buttons } = {}) {
    super()
    this.accessToken = null
    this.services = null
    this._hostOrigin = null
    this._sessions = new Map()
    this._buttons = buttons || null

    this._onMessage = this._handleMessage.bind(this)
    window.addEventListener('message', this._onMessage)

    window.parent.postMessage({
      type: 'loaded',
      payload: {
        title: title || undefined,
        buttons: buttons || undefined
      }
    }, '*')
  }

  _postToHost(data) {
    if (this._hostOrigin) {
      window.parent.postMessage(data, this._hostOrigin)
    }
  }

  _handleMessage(event) {
    const msg = event.data
    if (!msg || !msg.type) return

    if (!this._hostOrigin) {
      this._hostOrigin = event.origin
    } else if (event.origin !== this._hostOrigin) {
      return
    }

    switch (msg.type) {
      case 'access_token':
        if (msg.payload) {
          this.accessToken = msg.payload.accessToken
          this.dispatchEvent(new CustomEvent('token', { detail: { accessToken: this.accessToken } }))
        }
        break

      case 'services':
        if (msg.payload) {
          this.services = msg.payload
          this.dispatchEvent(new CustomEvent('services', { detail: this.services }))
        }
        break

      case 'button_click': {
        const name = msg.payload && msg.payload.name
        const ext = this
        this.dispatchEvent(new CustomEvent('button', {
          detail: {
            name,
            ack(buttons) {
              ext._postToHost({
                type: 'button_click_ack',
                payload: { buttons: buttons || ext._buttons }
              })
            }
          }
        }))
        break
      }

      case 'collab_synced': {
        const session = this._sessions.get(msg.payload.uuid)
        if (session) {
          session._onSynced(msg.payload.update, this._postToHost.bind(this))
        }
        break
      }

      case 'collab_update': {
        const session = this._sessions.get(msg.payload.uuid)
        if (session) {
          session._onUpdate(msg.payload.update)
        }
        break
      }

      case 'collab_awareness': {
        const session = this._sessions.get(msg.payload.uuid)
        if (session) {
          session._onAwareness(msg.payload.states)
        }
        break
      }

      case 'collab_error': {
        const uuid = msg.payload && msg.payload.uuid
        const session = this._sessions.get(uuid)
        if (session) {
          session._onError(msg.payload.error)
          session._destroy()
          this._sessions.delete(uuid)
        }
        break
      }
    }
  }

  setTitle(title) {
    this._postToHost({ type: 'set_title', payload: { title } })
  }

  setButtons(buttons) {
    this._buttons = buttons
    this._postToHost({ type: 'set_buttons', payload: { buttons } })
  }

  openView(name, props, target) {
    this._postToHost({
      type: 'open',
      payload: { name, props, target }
    })
  }

  openCollab(uuid) {
    if (this._sessions.has(uuid)) {
      return this._sessions.get(uuid)
    }
    const session = new CollabSession(uuid)
    this._sessions.set(uuid, session)
    this._postToHost({ type: 'open_collab', payload: { uuid } })
    return session
  }

  closeCollab(uuid) {
    const session = this._sessions.get(uuid)
    if (session) {
      session._destroy()
      this._sessions.delete(uuid)
      this._postToHost({ type: 'close_collab', payload: { uuid } })
    }
  }

  getCollab(uuid) {
    return this._sessions.get(uuid)
  }

  destroy() {
    window.removeEventListener('message', this._onMessage)
    for (const [uuid, session] of this._sessions) {
      session._destroy()
      this._postToHost({ type: 'close_collab', payload: { uuid } })
    }
    this._sessions.clear()
  }
}
