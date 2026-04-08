class logger {
  static info(title, ...args) {
    console.log(`Dorman ${title || ""} | `, ...args);
  }
  static debug(isDebug, ...args) {
    if (isDebug) {
      this.info("Dorman DEBUG | ", ...args);
    }
  }
  static error(title, ...args) {
    console.error(`Dorman ${title || ""} | ERROR | `, ...args);
    ui.notifications.error(`${title || ""} | ERROR | ${args[0]}`);
  }
  static notify(...args) {
    ui.notifications.notify(`Dorman ${args[0]}`);
  }
}
class HELPER {
  static localize(...args) {
    return game.i18n.localize(...args);
  }
  static format(key, data) {
    return game.i18n.format(key, data);
  }
  static setting(moduleName, key) {
    return game.settings.get(moduleName, key);
  }
  static isTurnChange(combat, changed) {
    const liveCombat = !!combat.started && ("turn" in changed || "round" in changed);
    const anyCombatants = (combat.combatants.size ?? 0) !== 0;
    const notFirstTurn = !((changed.turn ?? void 0) === 0 && (changed.round ?? 0) === 1);
    return liveCombat && anyCombatants && notFirstTurn;
  }
  static isFirstTurn(combat, changed) {
    return combat.started && changed.round === 1;
  }
  static firstGM() {
    return game.users.find((u) => u.isGM && u.active);
  }
  static isFirstGM() {
    return game.user.id === HELPER.firstGM()?.id;
  }
  static async wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  static async waitFor(fn, m = 200, w = 100, i = 0) {
    while (!fn(i, i * w / 100) && i < m) {
      i++;
      await HELPER.wait(w);
    }
    return i !== m;
  }
  static stringToDom(innerHTML, className) {
    const dom = document.createElement("div");
    dom.innerHTML = innerHTML;
    dom.className = className;
    return dom;
  }
  /**
   * Simple button dialog using Foundry v13 DialogV2.
   */
  static async buttonDialog(data, _direction = "row") {
    const buttons = data.buttons.map((button, index) => ({
      action: `button-${index}`,
      label: button.label,
      callback: () => button.value
    }));
    return foundry.applications.api.DialogV2.wait({
      window: { title: data.title },
      content: data.content,
      buttons,
      close: () => "Exit, No Button Click"
    });
  }
}
const NAME$1 = "dormanlakely-legendary-actions";
const PATH = `/modules/${NAME$1}`;
const TITLE = "Dorman Lakely's Legendary Actions";
const { ApplicationV2: ApplicationV2$1, DialogV2 } = foundry.applications.api;
class PatreonLink extends ApplicationV2$1 {
  static DEFAULT_OPTIONS = {
    id: "dormanlakely-legendary-actions-patreon",
    classes: [],
    tag: "div",
    window: {
      title: "Support on Patreon",
      icon: "fab fa-patreon"
    },
    position: { width: 1, height: 1 }
  };
  async _renderHTML() {
    return document.createElement("div");
  }
  _replaceHTML(result, content) {
    content.replaceChildren(result);
  }
  async _onFirstRender(_context, _options) {
    this.element?.style?.setProperty("display", "none");
    await DialogV2.prompt({
      window: { title: "Support on Patreon" },
      content: "<p>Open the Patreon page in a new tab.</p>",
      ok: {
        label: '<i class="fab fa-patreon"></i> Visit Patreon',
        callback: () => {
          window.open("https://patreon.com/jesshmusic", "_blank", "noopener,noreferrer");
        }
      }
    });
    this.close();
  }
}
class DmGuruLink extends ApplicationV2$1 {
  static DEFAULT_OPTIONS = {
    id: "dormanlakely-legendary-actions-dmguru",
    classes: [],
    tag: "div",
    window: {
      title: "Dungeon Master Guru",
      icon: "fas fa-dragon"
    },
    position: { width: 1, height: 1 }
  };
  async _renderHTML() {
    return document.createElement("div");
  }
  _replaceHTML(result, content) {
    content.replaceChildren(result);
  }
  async _onFirstRender(_context, _options) {
    this.element?.style?.setProperty("display", "none");
    await DialogV2.prompt({
      window: { title: "Dungeon Master Guru" },
      content: "<p>Open the Dungeon Master Guru site in a new tab.</p>",
      ok: {
        label: '<i class="fas fa-dragon"></i> Visit Dungeon Master Guru',
        callback: () => {
          window.open("https://dungeonmaster.guru", "_blank", "noopener,noreferrer");
        }
      }
    });
    this.close();
  }
}
class MODULE {
  static data;
  static async register() {
    logger.info(NAME$1, "Initializing Module");
    MODULE.globals();
    MODULE.debugSettings();
  }
  static async build() {
    MODULE.data = { name: NAME$1, path: PATH, title: TITLE };
  }
  static globals() {
    game.dnd5e.npcactions = {};
  }
  static debugSettings() {
    const config = true;
    const settingsData = {
      debug: {
        scope: "world",
        config,
        default: false,
        type: Boolean
      }
    };
    MODULE.applySettings(settingsData);
  }
  static applySettings(settingsData) {
    Object.entries(settingsData).forEach(([key, data]) => {
      game.settings.register(MODULE.data.name, key, {
        name: HELPER.localize(`setting.${key}.name`),
        hint: HELPER.localize(`setting.${key}.hint`),
        ...data
      });
    });
    game.settings.registerMenu(MODULE.data.name, "patreonLink", {
      name: "Support on Patreon",
      label: "Visit Patreon",
      hint: "Support the development of this module on Patreon! Your contributions help fund new features and updates.",
      icon: "fab fa-patreon",
      type: PatreonLink,
      restricted: false
    });
    game.settings.registerMenu(MODULE.data.name, "dmGuruLink", {
      name: "Dungeon Master Guru",
      label: "Visit Dungeon Master Guru",
      hint: "SRD rules and DM tools. Free resources for Dungeon Masters at dungeonmaster.guru.",
      icon: "fas fa-dragon",
      type: DmGuruLink,
      restricted: false
    });
  }
}
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
class ActionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  combatants;
  actionOptions;
  constructor(combatants, options = {}) {
    super(options);
    this.combatants = combatants;
    this.actionOptions = {
      action: options.action ?? true,
      bonus: options.bonus ?? true,
      reaction: options.reaction ?? true,
      legendary: options.legendary ?? true,
      lair: options.lair ?? true,
      special: options.special ?? true
    };
  }
  static DEFAULT_OPTIONS = {
    id: "dla-action-dialog",
    classes: ["dormanlakely-legendary-actions", "dla-action-dialog"],
    tag: "div",
    window: {
      title: "Action Dialog",
      icon: "fa-solid fa-dragon",
      resizable: true,
      minimizable: true
    },
    position: {
      width: 550,
      height: "auto"
    },
    actions: {
      useItem: ActionDialog.#onUseItem,
      focusToken: ActionDialog.#onFocusToken,
      close: ActionDialog.#onClose
    }
  };
  static PARTS = {
    content: {
      template: "modules/dormanlakely-legendary-actions/templates/action-dialog.hbs"
    }
  };
  /** Remember last position for each dialog ID */
  static _lastPosition = /* @__PURE__ */ new Map();
  get title() {
    return this.options.window?.title ?? "Action Dialog";
  }
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context["combatants"] = this._generateCombatantData();
    return context;
  }
  _generateCombatantData() {
    return this.combatants.map((combatant) => ({
      id: combatant.id,
      combatId: combatant.combat.id,
      img: combatant.img,
      name: combatant.name,
      items: {
        action: this.actionOptions.action ? this.getCombatantItemData(combatant, "action") : void 0,
        bonus: this.actionOptions.bonus ? this.getCombatantItemData(combatant, "bonus") : void 0,
        reaction: this.actionOptions.reaction ? this.getCombatantItemData(combatant, "reaction") : void 0,
        legendary: this.actionOptions.legendary ? this.getCombatantItemData(combatant, "legendary") : void 0,
        lair: this.actionOptions.lair ? this.getCombatantItemData(combatant, "lair") : void 0,
        special: this.actionOptions.special ? this.getCombatantItemData(combatant, "special") : void 0
      }
    }));
  }
  getCombatantItemData(combatant, type) {
    return combatant.actor.items.filter((item) => {
      if (item.type === "spell") return false;
      const contents = item?.system?.activities?.contents;
      if (contents?.length) {
        return contents.some((a) => a.activation?.type === type);
      }
      return item?.system?.activation?.type === type;
    }).map((item) => {
      const matchingActivity = item?.system?.activities?.contents?.find(
        (a) => a.activation?.type === type
      );
      const activationSource = matchingActivity?.activation ?? foundry.utils.getProperty(item, "system.activation");
      const uses = foundry.utils.getProperty(item, "system.uses");
      const hasUsesRemaining = !uses?.max || (uses.value ?? 0) > 0;
      const data = {
        name: item.name,
        id: item.id,
        activation: {
          type: activationSource?.type,
          cost: activationSource?.value,
          condition: activationSource?.condition,
          canUse: hasUsesRemaining,
          usesValue: uses?.max ? uses.value ?? 0 : void 0,
          usesMax: uses?.max ?? void 0
        },
        description: foundry.utils.getProperty(item, "system.description.value"),
        img: item.img,
        uuid: item.uuid
      };
      if (type === "legendary") {
        const legact = foundry.utils.getProperty(
          combatant.actor,
          "system.resources.legact"
        );
        const legactMax = legact?.max ?? 0;
        const legactSpent = legact?.spent ?? 0;
        const legactRemaining = legactMax - legactSpent;
        data.activation.available = legactRemaining;
        data.activation.availableMax = legactMax;
        data.activation.canUse = hasUsesRemaining && legactRemaining >= (data.activation.cost ?? 1);
      }
      return data;
    });
  }
  static async #onFocusToken(_event, target) {
    const combatantId = target.dataset["combatantId"];
    if (!combatantId || !game.combats.active) return;
    const token = game.combats.active.combatants.get(combatantId)?.token?.object;
    if (!token) return;
    token.control({ releaseOthers: true });
    canvas.animatePan({ x: token.x, y: token.y });
  }
  static async #onUseItem(event, target) {
    const itemUuid = target.dataset["uuid"];
    if (!itemUuid) return;
    const doc = await fromUuid(itemUuid);
    if (!doc || !doc.actor) return;
    const item = doc;
    const actor = item.actor;
    const legendaryActivity = item.system?.activities?.contents?.find(
      (a) => a.activation?.type === "legendary"
    );
    const legactSpentBefore = foundry.utils.getProperty(actor, "system.resources.legact.spent") ?? 0;
    if (legendaryActivity && typeof legendaryActivity.use === "function") {
      await legendaryActivity.use({ event });
    } else {
      await item.use({ event });
    }
    if (legendaryActivity) {
      const legactSpentAfter = foundry.utils.getProperty(actor, "system.resources.legact.spent") ?? 0;
      if (legactSpentAfter === legactSpentBefore) {
        const cost = legendaryActivity.activation?.value ?? 1;
        await actor.update({ "system.resources.legact.spent": legactSpentBefore + cost });
      }
    }
    logger.debug(false, "ActionDialog | Item used:", { itemUuid, item });
    if (this.combatants.length === 1) {
      return void this.close();
    } else {
      this.combatants = this.combatants.map(
        (c) => game.combats.active?.combatants.get(c.id) ?? c
      );
      return void this.render();
    }
  }
  static async #onClose(_event, _target) {
    this.close();
  }
  _onClose(options) {
    ActionDialog._lastPosition.set(
      this.options.id,
      { ...this.position }
    );
    super._onClose(options);
  }
  _onRender(context, options) {
    super._onRender(context, options);
    const lastPos = ActionDialog._lastPosition.get(this.options.id);
    if (lastPos) {
      this.setPosition(lastPos);
    }
    for (const item of this.element.querySelectorAll(".dla-action-item")) {
      const src = item.querySelector(".dla-action-tooltip-src");
      if (!src?.innerHTML.trim()) continue;
      item.addEventListener("pointerenter", () => {
        game.tooltip.activate(item, { content: src.innerHTML, direction: "RIGHT" });
      });
      item.addEventListener("pointerleave", () => game.tooltip.deactivate());
    }
  }
}
class LegendaryActionDialog extends ActionDialog {
  constructor(combatants) {
    super(combatants, {
      id: "dla-legendary-action-dialog",
      window: { title: HELPER.localize("DND5E.LegendaryAction.LabelPl") },
      legendary: true,
      action: false,
      bonus: false,
      reaction: false,
      lair: false,
      special: false
    });
  }
}
class UpdateQueue {
  entityType;
  queue;
  inFlight;
  constructor(entityType) {
    this.entityType = entityType;
    this.queue = [];
    this.inFlight = false;
  }
  queueUpdate(fn) {
    this.queue.push(fn);
    if (!this.inFlight) {
      this.runUpdate();
    }
  }
  async runUpdate() {
    this.inFlight = true;
    while (this.queue.length > 0) {
      const updateIndex = this.queue.length - 1;
      const updateFn = this.queue[updateIndex];
      try {
        await updateFn();
      } catch (e) {
        logger.error("UpdateQueue", e);
      } finally {
        this.queue.splice(updateIndex, 1);
      }
    }
    this.inFlight = false;
  }
}
const updateQueue = new UpdateQueue("All");
function queueUpdate(updateFn) {
  updateQueue.queueUpdate(updateFn);
}
const NAME = "LegendaryActionManagement";
class LegendaryActionManagement {
  /** @public */
  static register() {
    this.settings();
    this.hooks();
  }
  /** @public */
  static settings() {
    const settingsData = {
      legendaryActionHelper: {
        scope: "world",
        config: true,
        default: true,
        type: Boolean
      }
    };
    MODULE.applySettings(settingsData);
  }
  /** @public */
  static hooks() {
    Hooks.on("createCombatant", LegendaryActionManagement._createCombatant);
    Hooks.on("updateCombat", LegendaryActionManagement._updateCombat);
  }
  /**
   * Check Combatant for Legendary Actions and flag if found.
   */
  static _createCombatant(combatant) {
    if (!HELPER.isFirstGM()) return;
    const hasLegendary = !!combatant.actor?.items.find((i) => {
      if (i.type === "spell") return false;
      const activities = i.system?.activities;
      if (activities?.size) {
        return activities.some((a) => a.activation?.type === "legendary");
      }
      return i.system?.activation?.type === "legendary";
    });
    if (hasLegendary) {
      logger.debug(
        game.settings.get(MODULE.data.name, "debug"),
        `${NAME} | flagging as legendary combatant: ${combatant.name}`,
        combatant
      );
      queueUpdate(async () => {
        await combatant.setFlag(MODULE.data.name, "hasLegendary", true);
      });
    }
  }
  /**
   * On each combat turn change, optionally show legendary action dialog and/or
   * recharge legendary actions for the combatant whose turn just ended.
   */
  static _updateCombat(combat, changed) {
    if (!HELPER.isFirstGM()) return;
    if (!HELPER.isTurnChange(combat, changed)) return;
    const previousId = combat.previous?.combatantId;
    if (HELPER.setting(MODULE.data.name, "legendaryActionHelper")) {
      let legendaryCombatants = combat.combatants.filter(
        (combatant) => combatant.getFlag(MODULE.data.name, "hasLegendary") && combatant.id !== previousId
      );
      legendaryCombatants = legendaryCombatants.filter(
        (combatant) => (foundry.utils.getProperty(combatant.actor, "system.resources.legact.value") ?? 0) > 0
      );
      legendaryCombatants = legendaryCombatants.filter(
        (combatant) => (foundry.utils.getProperty(combatant.actor, "system.attributes.hp.value") ?? 0) > 0
      );
      if (legendaryCombatants.length > 0) {
        LegendaryActionManagement.showLegendaryActions(legendaryCombatants);
      }
    }
  }
  /** @private */
  static showLegendaryActions(combatants) {
    new LegendaryActionDialog(combatants).render(true);
  }
}
const SUB_MODULES = {
  MODULE,
  LegendaryActionManagement
};
MODULE.build();
Hooks.once("init", () => {
  const moduleData = game.modules.get(MODULE.data.name);
  const version = moduleData?.version ?? "0.0.0";
  console.log(
    "%c⚔️ Dorman Lakely's Legendary Actions %cv" + version,
    "color: #d32f2f; font-weight: bold; font-size: 16px;",
    "color: #ff9800; font-weight: bold; font-size: 14px;"
  );
});
Hooks.once("ready", () => {
  console.log(
    "%c⚔️ Dorman Lakely's Legendary Actions %c✓ Ready!",
    "color: #d32f2f; font-weight: bold; font-size: 16px;",
    "color: #4caf50; font-weight: bold; font-size: 14px;"
  );
});
Hooks.on("setup", () => {
  Object.values(SUB_MODULES).forEach((cl) => cl.register());
  Hooks.callAll("npcactionsReady", { MODULE, logger });
});
//# sourceMappingURL=main.js.map
