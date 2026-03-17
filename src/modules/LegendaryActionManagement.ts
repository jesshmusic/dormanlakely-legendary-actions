import { logger } from '../utils/logger.js';
import { MODULE } from '../module.js';
import { HELPER } from '../utils/helper.js';
import { LegendaryActionDialog } from '../apps/ActionDialog.js';
import { queueUpdate } from '../utils/update-queue.js';

const NAME = "LegendaryActionManagement";

/**
 * LegendaryActionManagement
 * Manages Legendary Action economy per the dnd5e rules.
 */
export class LegendaryActionManagement {
    /** @public */
    static register(): void {
        this.settings();
        this.hooks();
    }

    /** @public */
    static settings(): void {
        const config = false;
        const settingsData: Record<string, {
            scope: string;
            config: boolean;
            group: string;
            default: boolean;
            type: typeof Boolean;
        }> = {
            legendaryActionRecharge: {
                scope: "world", config, group: "legendary", default: false, type: Boolean,
            },
            legendaryActionHelper: {
                scope: "world", config, group: "legendary", default: false, type: Boolean,
            },
        };

        MODULE.applySettings(settingsData);
    }

    /** @public */
    static hooks(): void {
        Hooks.on("createCombatant", LegendaryActionManagement._createCombatant);
        Hooks.on("updateCombat", LegendaryActionManagement._updateCombat);
    }

    /**
     * Check Combatant for Legendary Actions and flag if found.
     */
    static _createCombatant(combatant: Combatant): void {
        if (!HELPER.isFirstGM()) return;

        const hasLegendary = !!combatant.actor?.items.find((i) => {
            if (i.system?.activities?.size) {
                return i.system.activities.some((a) => a.activation?.type === "legendary");
            }
            return i.system?.activation?.type === "legendary";
        });

        if (hasLegendary) {
            logger.debug(
                game.settings.get(MODULE.data.name, "debug") as boolean,
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
    static _updateCombat(combat: Combat, changed: Partial<Combat>): void {
        if (!HELPER.isFirstGM()) return;
        if (!HELPER.isTurnChange(combat, changed)) return;

        const previousId = combat.previous?.combatantId;

        if (HELPER.setting(MODULE.data.name, "legendaryActionHelper")) {
            let legendaryCombatants = combat.combatants.filter(
                (combatant) =>
                    combatant.getFlag(MODULE.data.name, "hasLegendary") &&
                    combatant.id !== previousId
            );

            legendaryCombatants = legendaryCombatants.filter(
                (combatant) =>
                    ((foundry.utils.getProperty(combatant.actor, "system.resources.legact.value") as number) ?? 0) > 0
            );
            legendaryCombatants = legendaryCombatants.filter(
                (combatant) =>
                    ((foundry.utils.getProperty(combatant.actor, "system.attributes.hp.value") as number) ?? 0) > 0
            );

            if (legendaryCombatants.length > 0) {
                LegendaryActionManagement.showLegendaryActions(legendaryCombatants);
            }
        }

        if (HELPER.setting(MODULE.data.name, "legendaryActionRecharge")) {
            if (previousId) {
                const previousCombatant = combat.combatants.get(previousId);
                if (previousCombatant?.getFlag(MODULE.data.name, "hasLegendary")) {
                    LegendaryActionManagement.rechargeLegendaryActions(previousCombatant);
                }
            }
        }
    }

    /** @private */
    static showLegendaryActions(combatants: Combatant[]): void {
        new LegendaryActionDialog(combatants).render(true);
    }

    /** @private */
    static rechargeLegendaryActions(combatant: Combatant): void {
        if (!combatant.actor || !combatant.token) return;

        const legact = foundry.utils.getProperty(
            combatant.actor,
            "system.resources.legact"
        ) as LegactResource | undefined;

        if (legact && legact.value !== null) {
            if (legact.value < legact.max) {
                ui.notifications.info(
                    game.i18n.format("DLA.CombatLegendary_notification", {
                        max: legact.max,
                        tokenName: combatant.token.name,
                    })
                );

                queueUpdate(async () => {
                    const newActor = await combatant.actor.update({
                        "system.resources.legact.value": legact.max,
                    });
                    newActor.sheet.render(false);
                });
            }
        }
    }
}
