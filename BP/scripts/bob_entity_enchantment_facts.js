const BOB_ENTITY_ENCHANTMENT_SYSTEM = Object.freeze({
  system: "better_on_bedrock:entity_enchantments",
  enabledProperty: "better_on_bedrock:enchanted",
  typeProperty: "better_on_bedrock:enchantment_type",
  levelProperty: "better_on_bedrock:enchantment_level",
  none: "none",
  vocabulary: Object.freeze({
    none: Object.freeze({ labelKey: "gui.none", behavior: "none" }),
    sharpness: Object.freeze({ labelKey: "enchantment.damage.all", behavior: "extra_damage" }),
    protection: Object.freeze({ labelKey: "enchantment.protect.all", behavior: "damage_reduction" }),
    projectile_protection: Object.freeze({ labelKey: "enchantment.protect.projectile", behavior: "projectile_damage_reduction" }),
    fire_protection: Object.freeze({ labelKey: "enchantment.protect.fire", behavior: "fire_damage_reduction" }),
    punch: Object.freeze({ labelKey: "enchantment.arrowKnockback", behavior: "projectile_knockback" }),
    flame: Object.freeze({ labelKey: "enchantment.arrowFire", behavior: "projectile_fire" }),
    power: Object.freeze({ labelKey: "enchantment.arrowDamage", behavior: "projectile_damage" }),
    mending: Object.freeze({ labelKey: "enchantment.mending", behavior: "self_heal_from_target_xp" }),
    thorns: Object.freeze({ labelKey: "enchantment.thorns", behavior: "retaliation_damage" }),
    infested: Object.freeze({ labelKey: "effect.infested", behavior: "spawn_silverfish_on_hit" }),
    knockback: Object.freeze({ labelKey: "enchantment.knockback", behavior: "melee_knockback" }),
    fire_aspect: Object.freeze({ labelKey: "enchantment.fire", behavior: "melee_fire" }),
    oozing: Object.freeze({ labelKey: "effect.oozing", behavior: "spawn_slime_on_hit" })
  })
});

const BOB_ENTITY_ENCHANTMENT_IDS = Object.freeze(new Set([
  "better_on_bedrock:deer",
  "better_on_bedrock:enchanted_book",
  "better_on_bedrock:enchanted_book_projectile",
  "better_on_bedrock:thrown_amethyst_spear",
  "better_on_bedrock:thrown_diamond_spear",
  "better_on_bedrock:thrown_golden_spear",
  "better_on_bedrock:thrown_iron_spear",
  "better_on_bedrock:thrown_stardust_spear",
  "better_on_bedrock:thrown_stone_spear",
  "better_on_bedrock:thrown_wooden_spear",
  "minecraft:chicken",
  "minecraft:cow",
  "minecraft:drowned",
  "minecraft:evocation_illager",
  "minecraft:husk",
  "minecraft:phantom",
  "minecraft:pig",
  "minecraft:pillager",
  "minecraft:rabbit",
  "minecraft:skeleton",
  "minecraft:zombie"
]));

export function bobEntityEnchantmentFacts(kind, typeId) {
  if (kind !== "entity" || !BOB_ENTITY_ENCHANTMENT_IDS.has(typeId)) return undefined;
  return BOB_ENTITY_ENCHANTMENT_SYSTEM;
}
