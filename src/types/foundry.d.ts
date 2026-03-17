/**
 * Minimal Foundry VTT type declarations for dormanlakely-legendary-actions.
 * Full types live in @league-of-foundry-developers/foundry-vtt-types;
 * these are lightweight stubs that satisfy the TypeScript compiler for
 * the globals Foundry injects at runtime.
 */

declare global {
  // ---- Core Foundry globals ----
  const Hooks: {
    on(event: string, fn: (...args: unknown[]) => unknown): number;
    callAll(event: string, ...args: unknown[]): void;
  };

  const fromUuid: (uuid: string) => Promise<FoundryDocument | null>;

  const canvas: {
    animatePan(options: { x: number; y: number }): void;
  };

  const ui: {
    notifications: {
      info(msg: string): void;
      error(msg: string): void;
      notify(msg: string): void;
    };
  };

  namespace foundry {
    namespace utils {
      function getProperty(obj: object, key: string): unknown;
      function expandObject(obj: Record<string, unknown>): Record<string, unknown>;
    }
    namespace applications {
      namespace api {
        class ApplicationV2 {
          options: Readonly<ApplicationV2Options>;
          position: ApplicationPosition;
          element: HTMLElement;
          tabGroups: Record<string, string>;
          constructor(options?: Partial<ApplicationV2Options>);
          render(force?: boolean): this;
          close(options?: object): Promise<void>;
          setPosition(pos: Partial<ApplicationPosition>): void;
          _prepareContext(options: object): Promise<Record<string, unknown>>;
          _preparePartContext(partId: string, context: Record<string, unknown>): Promise<Record<string, unknown>>;
          _configureRenderOptions(options: object): void;
          _onClose(options: object): void;
          _onRender(context: Record<string, unknown>, options: object): void;
        }

        function HandlebarsApplicationMixin<T extends typeof ApplicationV2>(
          Base: T
        ): T;

        class DialogV2 {
          static wait(options: {
            window?: { title: string };
            content?: string;
            buttons: Array<{
              action: string;
              label: string;
              callback: () => unknown;
            }>;
            close?: () => unknown;
          }): Promise<unknown>;
        }
      }
    }
  }

  interface ApplicationV2Options {
    id: string;
    classes: string[];
    tag: string;
    window: {
      title: string;
      icon?: string;
      resizable?: boolean;
      minimizable?: boolean;
    };
    position: {
      width: number | "auto";
      height: number | "auto";
    };
    actions: Record<string, (...args: unknown[]) => unknown>;
    form?: {
      handler: (...args: unknown[]) => unknown;
      closeOnSubmit?: boolean;
    };
  }

  interface ApplicationPosition {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
  }

  // ---- dnd5e / Foundry document types ----
  interface FoundryDocument {
    id: string;
    uuid: string;
    name: string;
  }

  interface LegactResource {
    max: number;
    spent: number;
    /** Computed: max - spent */
    value: number;
  }

  interface ActorSystem {
    resources: {
      legact: LegactResource;
    };
    attributes: {
      hp: { value: number; max: number };
    };
  }

  interface ItemActivity {
    activation?: {
      type?: string;
      value?: number;
      condition?: string;
    };
  }

  interface ItemActivation {
    type?: string;
    value?: number;
    condition?: string;
  }

  interface ItemUses {
    value?: number;
    max?: number;
  }

  interface ItemSystem {
    activities?: {
      size: number;
      contents: ItemActivity[];
      some(fn: (a: ItemActivity) => boolean): boolean;
      find(fn: (a: ItemActivity) => boolean): ItemActivity | undefined;
    };
    activation?: ItemActivation;
    uses?: ItemUses;
    description?: { value?: string };
  }

  interface Item extends FoundryDocument {
    type: string;
    img: string;
    system: ItemSystem;
    actor: Actor;
    use(options?: { event?: Event }): Promise<unknown>;
  }

  interface Actor extends FoundryDocument {
    type: string;
    system: ActorSystem;
    items: {
      find(fn: (i: Item) => boolean): Item | undefined;
      filter(fn: (i: Item) => boolean): Item[];
      map<T>(fn: (i: Item) => T): T[];
    };
    sheet: { render(force: boolean): void };
    update(data: Record<string, unknown>): Promise<Actor>;
    rollSavingThrow(options: { ability: string }): Promise<unknown>;
  }

  interface TokenDocument extends FoundryDocument {
    object: {
      x: number;
      y: number;
      control(options: { releaseOthers: boolean }): void;
    };
  }

  interface Combatant extends FoundryDocument {
    actor: Actor;
    token: TokenDocument;
    combat: Combat;
    img: string;
    getFlag(moduleName: string, key: string): unknown;
    setFlag(moduleName: string, key: string, value: unknown): Promise<void>;
  }

  interface CombatantCollection {
    size: number;
    filter(fn: (c: Combatant) => boolean): Combatant[];
    get(id: string): Combatant | undefined;
    map<T>(fn: (c: Combatant) => T): T[];
  }

  interface Combat extends FoundryDocument {
    started: boolean;
    combatants: CombatantCollection;
    previous: { combatantId?: string } | null;
    turn: number;
    round: number;
  }

  interface GameUser {
    id: string;
    isGM: boolean;
    active: boolean;
    can(permission: string): boolean;
  }

  interface Game {
    user: GameUser;
    users: { find(fn: (u: GameUser) => boolean): GameUser | undefined };
    settings: {
      get(namespace: string, key: string): unknown;
      set(namespace: string, key: string, value: unknown): Promise<void>;
      register(namespace: string, key: string, data: object): void;
      registerMenu(namespace: string, key: string, data: object): void;
      settings: Map<string, SettingConfig>;
      menus: { get(key: string): { type: new () => unknown } | undefined };
    };
    i18n: {
      localize(key: string): string;
      format(key: string, data?: Record<string, unknown>): string;
    };
    combats: {
      active: Combat | null;
    };
    system: { title: string };
    dnd5e: { npcactions: Record<string, unknown> };
    tooltip: {
      activate(el: Element, opts: { content: string; direction: string }): void;
      deactivate(): void;
    };
  }

  interface SettingConfig {
    namespace: string;
    key: string;
    scope: string;
    config: boolean;
    group?: string;
    type: unknown;
    choices?: Record<string, string>;
    range?: { min: number; max: number; step: number };
    default: unknown;
  }

  const game: Game;
}

export {};
