import { get, type Writable, writable } from 'svelte/store';
import { v4 as uuid } from 'uuid';

import type { RectDimension } from 'core/interfaces';
import { geometryManager } from 'core/services';

import { Tools, type Tool } from 'client/interfaces';
import { toolbarStore } from 'client/ui/Toolbar/store';

import type { LayerEventDetails } from '../ResizableLayer/interfaces';

export interface ConnectedBox {
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
  selectedConnections: Writable<Connection> = writable({});

  connectionIdsByBoxId: { [boxId: string]: string[] } = {};
  #tool: Tool | null = null;

  constructor() {
    toolbarStore.tool.subscribe((value) => (this.#tool = value));
  }

  handleCanvasMouseMove(e: MouseEvent) {
    const currentConnection = get(this.currentConnection);
    if (this.#tool !== Tools.CONNECT || !currentConnection?.source) return;

    const point = geometryManager.calculatePosition(e);

    this.currentConnection.set({
      source: currentConnection.source,
      target: { box: { x: point.x, y: point.y, width: 0, height: 0 } },
    });
  }

  handleBoxEnter(e: CustomEvent<LayerEventDetails>, boxId: string) {
    const currentConnection = get(this.currentConnection);
    if (this.#tool !== Tools.CONNECT || !currentConnection?.source) return;

    const rect = geometryManager.getRectDimensionFromBounds(e.detail?.bounds);

    this.currentConnection.set({
      source: currentConnection.source,
      target: { id: boxId, box: rect! },
    });
  }

  handleBoxSelect = (e: CustomEvent<LayerEventDetails>, boxId: string) => {
    if (this.#tool !== Tools.CONNECT) return;
    const currentConnection = get(this.currentConnection);
    const rect = geometryManager.getRectDimensionFromBounds(e.detail?.bounds);

    if (currentConnection?.source) {
      const connectionId = uuid();

      this.connections.update((store) => {
        store[connectionId] = {
          source: currentConnection.source!,
          target: { id: boxId, box: rect! },
        };

        return store;
      });

      const sourceBoxId = currentConnection.source.id;
      if (sourceBoxId) {
        this.#updateConnectionIdsByBoxId(sourceBoxId, connectionId);
      }

      this.#updateConnectionIdsByBoxId(boxId, connectionId);
      this.currentConnection.set(null);
    } else {
      this.currentConnection.set({ source: { id: boxId, box: rect! } });
    }
  };

  handleBoxMove = (e: CustomEvent<LayerEventDetails>, boxId: string) => {
    const connectionIds = this.connectionIdsByBoxId[boxId];
    if (!connectionIds) return;

    const connections = get(this.connections);
    const rect = geometryManager.getRectDimensionFromBounds(e.detail?.bounds);

    connectionIds.forEach((connectionId) => {
      const connection = connections[connectionId];

      if (connection.source.id === boxId) {
        connection.source.box = rect!;
      } else if (connection.target.id === boxId) {
        connection.target.box = rect!;
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

    this.selectedConnections.update((connections) => this.#removeSelectedConnections(connections));
  }

  removeConnection() {
    this.connections.update((store) => this.#removeSelectedConnections(store));
    this.selectedConnections.update((store) => this.#removeSelectedConnections(store));
  }

  selectConnection(connectionId: string, connection: BoxToBoxConnection) {
    this.selectedConnections.update((connections) => ({
      ...connections,
      [connectionId]: connection,
    }));
  }

  deselectConnection(connectionId: string) {
    this.selectedConnections.update((connections) => {
      if (connections[connectionId]) {
        delete connections[connectionId];
      }
      return connections;
    });
  }

  #removeSelectedConnections(store: Connection): Connection {
    const selected = get(this.selectedConnections);
    const boxIds: string[] = [];

    for (const connectionId of Object.keys(selected)) {
      if (store[connectionId]) {
        boxIds.push(store[connectionId].source.id!);
        boxIds.push(store[connectionId].target.id!);
        delete store[connectionId];
      }
    }

    if (!boxIds.length) return store;

    boxIds.forEach((boxId) => {
      const connectionIds = this.connectionIdsByBoxId[boxId];
      this.connectionIdsByBoxId[boxId] = connectionIds.filter(
        (id) => !Object.keys(selected).includes(id),
      );
    });

    return store;
  }

  #updateConnectionIdsByBoxId(boxId: string, connectionId: string) {
    this.connectionIdsByBoxId[boxId] = [...(this.connectionIdsByBoxId[boxId] || []), connectionId];
  }
}

export const connectionStore = new ConnectionStore();
