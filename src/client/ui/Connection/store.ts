import { get, type Writable, writable } from 'svelte/store';
import { v4 as uuid } from 'uuid';

import type { OriginalEvent, RectDimension } from 'core/interfaces';
import { geometryManager } from 'core/services';

import { Tools, type Tool } from 'client/interfaces';
import { toolbarStore } from 'client/ui/Toolbar/store';

interface ConnectedBox {
  id?: string;
  box: RectDimension;
}

interface Connection {
  [connectionId: string]: BoxToBoxConnection;
}

interface BoxToBoxConnection {
  source: ConnectedBox;
  target: ConnectedBox;
}

class ConnectionStore {
  currentConnection: Writable<Partial<BoxToBoxConnection> | null> = writable(null);
  connections: Writable<Connection> = writable({});
  connectionIdsByBoxId: { [uuid: string]: string[] } = {};

  #tool: Tool | null = null;

  constructor() {
    toolbarStore.tool.subscribe((value) => (this.#tool = value));
  }

  handleMouseMove(e: OriginalEvent) {
    const currentConnection = get(this.currentConnection);
    if (this.#tool !== Tools.CONNECT || !currentConnection?.source) return;

    const point = geometryManager.calculatePosition(e);

    this.currentConnection.set({
      source: currentConnection.source,
      target: { box: { x: point.x, y: point.y, width: 0, height: 0 } },
    });
  }

  handleBoxSelect = (e: CustomEvent<{ box: RectDimension }>, boxId: string) => {
    if (this.#tool !== Tools.CONNECT) return;
    const currentConnection = get(this.currentConnection);

    if (currentConnection?.source) {
      const connectionId = uuid();

      this.connections.update((store) => {
        store[connectionId] = {
          source: currentConnection.source!,
          target: { id: boxId, box: e.detail.box },
        };

        return store;
      });

      const sourceBoxId = currentConnection.source.id;
      if (sourceBoxId) {
        this.#updateConnectionIdsByBoxId(sourceBoxId, connectionId);
      }

      this.#updateConnectionIdsByBoxId(boxId, connectionId);
      this.currentConnection.set(null);
      toolbarStore.changeTool(Tools.SELECT);
    } else {
      this.currentConnection.set({ source: { id: boxId, box: e.detail.box } });
    }
  };

  handleBoxMove = (e: CustomEvent<{ box: RectDimension }>, boxId: string) => {
    const connectionIds = this.connectionIdsByBoxId[boxId];
    if (!connectionIds) return;

    const connections = get(this.connections);

    connectionIds.forEach((connectionId) => {
      const connection = connections[connectionId];

      if (connection.source.id === boxId) {
        connection.source.box = e.detail.box;
      } else if (connection.target.id === boxId) {
        connection.target.box = e.detail.box;
      }

      this.connections.update((store) => {
        store[connectionId] = connection;
        return store;
      });
    });
  };

  removeConnectionsByBoxId(boxId: string) {
    const connectionIds = this.connectionIdsByBoxId[boxId];
    if (!connectionIds) return;

    delete this.connectionIdsByBoxId[boxId];

    this.connections.update((store) => {
      connectionIds.forEach((connectionId) => {
        delete store[connectionId];
      });
      return store;
    });
  }

  #updateConnectionIdsByBoxId(boxId: string, connectionId: string) {
    this.connectionIdsByBoxId[boxId] = [...(this.connectionIdsByBoxId[boxId] || []), connectionId];
  }
}

export const connectionStore = new ConnectionStore();
