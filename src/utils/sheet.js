import { MODULE_SHORT } from "../module/const.js";
import { CoreUtility } from "./core.js";
import { ItemUtility, ITEM_TYPE } from "./item.js";
import { LogUtility } from "./log.js";
import { RenderUtility } from "./render.js";
import { SettingsUtility, SETTING_NAMES } from "./settings.js";

let _activate = false;

/**
 * Utility class to handle additional sheet functionality for the module.
 */
export class SheetUtility {
    static setAutoHeightOnSheet(sheet) {
        sheet?.setPosition({ height: "auto" })
    }

    static async addModuleContentToSheet(sheet, protoHtml) {
        const item = sheet?.object;

        if (!item || !item instanceof Item) {
            LogUtility.logError(CoreUtility.localize(`${MODULE_SHORT}.messages.error.objectNotExpectedType`, { type: "Item" }));
            return;
        }

        if (item.actor && item.actor.permission < 3) {
            return;
        }

        if (!CONFIG[`${MODULE_SHORT}`].validItemTypes.includes(item.type)) {
            return;
        }
        
        ItemUtility.refreshFlagsOnItem(item);

        let html = protoHtml;
        if (html[0].localName !== "div") {
            html = $(html[0].parentElement.parentElement);
        }

        if (SettingsUtility.getSettingValue(SETTING_NAMES.QUICK_ITEM_ENABLED)) {
            _addItemOptionsTab(html);
            await _addItemOptions(item, html);
        }        

        // Re-activate roll options tab if needed (after certain events it may be necessary).
        if (_activate) {
            sheet._tabs[0].activate(MODULE_SHORT);
            _activate = false;
        }
        
        SheetUtility.setAutoHeightOnSheet(sheet);
    }
}

/**
 * Adds an item options tab to the provided item sheet.
 * @param {Object} html The html data container of the sheet.
 * @private
 */
function _addItemOptionsTab(html) {
    const tabContainer = html.find("form nav.sheet-navigation.tabs");
    const tabTitle = `<a class="item" data-tab="${MODULE_SHORT}">${CoreUtility.localize(`${MODULE_SHORT}.sheet.tab.title`)}</a>`;

    tabContainer.append($(tabTitle));
}

/**
 * Adds roll configuration UI for a specific item sheet.
 * @param {Item} item The item to whom the sheet belongs.
 * @param {object} html The html data container of the sheet.
 * @private
 */
async function _addItemOptions(item, html) {
    const settingsContainer = html.find(".sheet-body");

    const properties = {
        dnd5e: CONFIG.DND5E,
        altRollEnabled: SettingsUtility.getSettingValue(SETTING_NAMES.ALT_ROLL_ENABLED),
        item,
        flags: item.flags,
        defLabel: CoreUtility.localize(`${MODULE_SHORT}.sheet.tab.section.defaultRoll`),
        altLabel: CoreUtility.localize(`${MODULE_SHORT}.sheet.tab.section.alternateRoll`),
        combinedDamageTypes: CONFIG[`${MODULE_SHORT}`].combinedDamageTypes,
        hasFlavor: item.system.chatFlavor && item.system.chatFlavor !== "",
        hasDamage: item.hasDamage,
        hasConsume: item.hasQuantity || item.hasUse || item.hasResource || item.hasRecharge,
        hasQuantity: item.hasQuantity,
        hasUses: item.hasUses,
        hasResource: item.hasResource,
        hasRecharge: item.hasRecharge,
        isAttack: item.hasAttack,
        isSave: item.hasSave,
        isCheck: item.hasAbilityCheck || item.type === ITEM_TYPE.TOOL,
        isVersatile: item.isVersatile,
        isAreaTarget: item.hasAreaTarget
    }

    const optionsTemplate = await RenderUtility.renderItemOptions(properties);

    settingsContainer.append(optionsTemplate);

    // Activate the quick roll tab if anything changes in any sub-field.
    // This is necessary because sometimes the sheet will revert to the original tab when re-rendering.
	const newSection = settingsContainer.find(".tab.item-rsr5e");
	newSection.find("input[type=text]").change(() => { _activate = true; });
	newSection.find("input[type=number]").change(() => { _activate = true; });
	newSection.find("input[type=checkbox]").change(() => {  _activate = true; });
	newSection.find("select").change(() => { _activate = true; });
}