import { get, type Writable, writable } from 'svelte/store';
import { v4 as uuid } from 'uuid';

import type { RectDimension } from 'core/interfaces';
import { geometryManager } from 'core/services';

import type { ResizableLayerEventDetails } from 'client/ui/ResizableLayer/interfaces';
import { Tools, type Tool } from 'client/shared/interfaces';
import { toolbarStore } from 'client/ui/Toolbar/store';

export interface ConnectedBox {
  id?: string;
  box: RectDimension;
}

interface BoxToBoxConnection {
  source: ConnectedBox;
  target: ConnectedBox;
}

class ConnectionStore {
  currentConnection: Writable<Partial<BoxToBoxConnection> | null> = writable(null);
  connections: Writable<Map<string, BoxToBoxConnection>> = writable(new Map());
  selectedConnections: Writable<Map<string, BoxToBoxConnection>> = writable(new Map());

  connectionIdsByBoxId: Map<string, string[]> = new Map();
  #tool: Tool | null = null;

  constructor() {
    toolbarStore.tool.subscribe((value) => (this.#tool = value));
  }

  handleCanvasMouseMove(e: MouseEvent) {
    const currentConnection = get(this.currentConnection);

    if (this.#tool !== Tools.CONNECT || !currentConnection?.source) return;

    this.currentConnection.set({
      source: currentConnection.source,
      target: { box: { ...geometryManager.calculatePosition(e), width: 0, height: 0 } },
    });
  }

  handleBoxEnter(e: CustomEvent<ResizableLayerEventDetails>, boxId: string) {
    if (!e.detail?.bounds) return;

    const currentConnection = get(this.currentConnection);
    if (this.#tool !== Tools.CONNECT || !currentConnection?.source) return;

    const rect = geometryManager.getRectDimensionFromBounds(e.detail.bounds);

    this.currentConnection.set({
      source: currentConnection.source,
      target: { id: boxId, box: rect },
    });
  }

  handleBoxSelect = (e: CustomEvent<ResizableLayerEventDetails>, boxId: string) => {
    if (!e.detail?.bounds) return;
    if (this.#tool !== Tools.CONNECT) return;

    const currentConnection = get(this.currentConnection);
    const rect = geometryManager.getRectDimensionFromBounds(e.detail?.bounds);

    if (boxId === currentConnection?.source?.id) {
      this.resetCurrentConnection();
      return;
    }

    if (currentConnection?.source) {
      const connectionId = uuid();

      this.connections.update((state) =>
        state.set(connectionId, {
          source: currentConnection.source as ConnectedBox,
          target: { id: boxId, box: rect },
        }),
      );

      const sourceBoxId = currentConnection.source.id;

      if (sourceBoxId) {
        this.#updateConnectionIdsByBoxId(sourceBoxId, connectionId);
      }

      this.#updateConnectionIdsByBoxId(boxId, connectionId);
      this.resetCurrentConnection();
    } else {
      this.currentConnection.set({ source: { id: boxId, box: rect } });
    }
  };

  handleBoxMove = (e: CustomEvent<ResizableLayerEventDetails>, boxId: string) => {
    if (!e.detail?.bounds) return;

    const connectionIds = this.connectionIdsByBoxId.get(boxId);
    if (!connectionIds) return;

    const connections = get(this.connections);
    const rect = geometryManager.getRectDimensionFromBounds(e.detail.bounds);

    for (const connectionId of connectionIds) {
      const connection = connections.get(connectionId);

      if (!connection) continue;

      if (connection.source.id === boxId) {
        connection.source.box = rect;
      } else if (connection.target.id === boxId) {
        connection.target.box = rect;
      }

      this.connections.update((state) => state.set(connectionId, connection));
    }
  };

  removeConnectionsByBoxId(boxId: string) {
    const connectionIds = this.connectionIdsByBoxId.get(boxId);
    if (!connectionIds) return;

    this.connectionIdsByBoxId.delete(boxId);

    this.connections.update((state) => {
      for (const connectionId of connectionIds) {
        state.delete(connectionId);
      }
      return state;
    });

    this.selectedConnections.update((state) => this.#removeSelectedConnections(state));
  }

  removeConnection() {
    this.connections.update((state) => this.#removeSelectedConnections(state));
    this.selectedConnections.update((state) => this.#removeSelectedConnections(state));
  }

  selectConnection(connectionId: string, connection: BoxToBoxConnection) {
    this.selectedConnections.update((state) => state.set(connectionId, connection));
  }

  deselectConnection(connectionId: string) {
    this.selectedConnections.update((state) => {
      if (state.get(connectionId)) state.delete(connectionId);
      return state;
    });
  }

  resetCurrentConnection() {
    this.currentConnection.set(null);
  }

  #removeSelectedConnections(
    connections: Map<string, BoxToBoxConnection>,
  ): Map<string, BoxToBoxConnection> {
    const selected = get(this.selectedConnections);
    const boxIds: string[] = [];

    for (const connectionId of selected.keys()) {
      const connection = connections.get(connectionId);
      if (!connection) continue;

      boxIds.push(connection.source.id!);
      boxIds.push(connection.target.id!);
      connections.delete(connectionId);
    }

    if (!boxIds.length) return connections;

    for (const boxId of boxIds) {
      const connectionIds = this.connectionIdsByBoxId.get(boxId);
      const filteredConnectionIds = (connectionIds || []).filter((id) => !selected.has(id));
      this.connectionIdsByBoxId.set(boxId, filteredConnectionIds);
    }

    return connections;
  }

  #updateConnectionIdsByBoxId(boxId: string, connectionId: string) {
    this.connectionIdsByBoxId.set(boxId, [
      ...(this.connectionIdsByBoxId.get(boxId) || []),
      connectionId,
    ]);
  }
}

export const connectionStore = new ConnectionStore();
