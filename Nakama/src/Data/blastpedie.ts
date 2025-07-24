const MinIV = 1;
const MaxIV = 31;

interface Blast {
    uuid: string;
    data_id: number;
    exp: number;
    iv: number;
    boss: boolean;
    shiny: boolean;
    activeMoveset: number[];
}

interface BlastData {
    id: number
    type: Type
    hp: number
    mana: number
    attack: number
    defense: number
    speed: number
    movepool: moveToLearn[]
    nextEvolution: nextEvolutionStruct | null
    catchRate: number
    expYield: number
    rarity: Rarity
}

interface nextEvolutionStruct {
    id: number
    levelRequired: number
}

interface modifierBlastStruct {
    stats: Stats
    amount: number
}

class BlastEntity {
    uuid: string;
    data_id: number;
    exp: number;
    iv: number;
    boss: boolean;
    shiny: boolean;

    maxHp: number;
    hp: number;
    maxMana: number;
    mana: number;

    status: Status;
    activeMoveset: number[];
    modifiers: modifierBlastStruct[];
    level: number;

    attack: number;
    defense: number;
    speed: number;

    constructor(uuid: string, data_id: number, exp: number, iv: number, boss: boolean, shiny: boolean, moveset: number[]) {
        this.uuid = uuid;
        this.data_id = data_id;
        this.exp = exp;
        this.iv = iv;
        this.boss = boss;
        this.shiny = shiny;
        this.activeMoveset = moveset;
        this.modifiers = [];

        this.status = Status.None;

        this.level = calculateLevelFromExperience(this.exp);

        this.maxHp = calculateBlastHp(getBlastDataById(this.data_id).hp, this.iv, this.level);
        this.hp = this.maxHp;
        this.maxMana = calculateBlastMana(getBlastDataById(this.data_id).mana, this.iv, this.level);
        this.mana = this.maxMana;

        this.attack = calculateBlastStat(getBlastDataById(this.data_id).attack, this.iv, this.level);
        this.defense = calculateBlastStat(getBlastDataById(this.data_id).defense, this.iv, this.level);
        this.speed = calculateBlastStat(getBlastDataById(this.data_id).speed, this.iv, this.level);
    }
}

// BlastData

const Pantin: BlastData = { // NORMAL
    id: 0,
    type: Type.Normal,
    hp: 80, mana: 75, attack: 70, defense: 65, speed: 60,
    movepool: [
        { move_id: Tackle.id, levelMin: 0 },
        { move_id: Punch.id, levelMin: 3 },
        { move_id: Stomp.id, levelMin: 6 },
        { move_id: Slam.id, levelMin: 9 },
        { move_id: Claw.id, levelMin: 12 },
        { move_id: ClawCombo.id, levelMin: 15 },
        { move_id: Slash.id, levelMin: 18 },
        { move_id: Cut.id, levelMin: 21 },
    ],
    nextEvolution: null, catchRate: 30, expYield: 64, rarity: Rarity.Common,
};

const Lizzy: BlastData = { // GRASS
    id: 1,
    type: Type.Grass,
    hp: 70, mana: 80, attack: 75, defense: 70, speed: 65,
    movepool: [
        { move_id: Leafs.id, levelMin: 0 },
        { move_id: Growth.id, levelMin: 2 },
        { move_id: VineWhip.id, levelMin: 4 },
        { move_id: Claw.id, levelMin: 8 },
        { move_id: RazorLeaf.id, levelMin: 6 },
        { move_id: Roots.id, levelMin: 10 },
        { move_id: GrassKnot.id, levelMin: 12 },
        { move_id: FlowerStorm.id, levelMin: 16 },
        { move_id: GreenTempest.id, levelMin: 20 },
        { move_id: MagikLeafs.id, levelMin: 24 },
        { move_id: EcoSphere.id, levelMin: 28 },
        { move_id: SolarBeam.id, levelMin: 32 },
    ],
    nextEvolution: null, catchRate: 35, expYield: 128, rarity: Rarity.Rare,
};

const Punchball: BlastData = { // FIRE
    id: 2,
    type: Type.Fire,
    hp: 85, mana: 70, attack: 80, defense: 75, speed: 60,
    movepool: [
        { move_id: Ember.id, levelMin: 0 },
        { move_id: OverHeat.id, levelMin: 2 },
        { move_id: Flamethrower.id, levelMin: 4 },
        { move_id: FirePunch.id, levelMin: 8 },
        { move_id: FireBlast.id, levelMin: 12 },
        { move_id: FireWheel.id, levelMin: 16 },
        { move_id: Nitro.id, levelMin: 20 },
        { move_id: Scald.id, levelMin: 24 },
        { move_id: FlareBlitz.id, levelMin: 28 },
        { move_id: FireClaw.id, levelMin: 32 },
    ],
    nextEvolution: null, catchRate: 40, expYield: 128, rarity: Rarity.Rare,
};

const Jellys: BlastData = { // WATER
    id: 3,
    type: Type.Water,
    hp: 75, mana: 85, attack: 70, defense: 65, speed: 80,
    movepool: [
        { move_id: AquaJet.id, levelMin: 0 },
        { move_id: AquaBoost.id, levelMin: 2 },
        { move_id: Waterfall.id, levelMin: 4 },
        { move_id: HydroTail.id, levelMin: 7 },
        { move_id: Aquagym.id, levelMin: 10 },
        { move_id: HydroBlast.id, levelMin: 12 },
        { move_id: Bubble.id, levelMin: 16 },
        { move_id: BubbleBeam.id, levelMin: 20 },
        { move_id: Surf.id, levelMin: 24 },
        { move_id: HydroCannon.id, levelMin: 28 },
    ],
    nextEvolution: null, catchRate: 25, expYield: 128, rarity: Rarity.Rare,
};

const Kitchi: BlastData = { // NORMAL
    id: 4,
    type: Type.Normal,
    hp: 55, mana: 70, attack: 75, defense: 65, speed: 80,
    movepool: [
        { move_id: Claw.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 2 },
        { move_id: Cut.id, levelMin: 4 },
        { move_id: Harden.id, levelMin: 6 },
        { move_id: QuickAttack.id, levelMin: 7 },
        { move_id: ClawCombo.id, levelMin: 8 },
        { move_id: Cleanse.id, levelMin: 10 },
        { move_id: Slash.id, levelMin: 14 },
    ],
    nextEvolution: { id: 5, levelRequired: 7 }, catchRate: 30, expYield: 64, rarity: Rarity.Common,
};

const Kenchi: BlastData = { // NORMAL
    id: 5,
    type: Type.Normal,
    hp: 50, mana: 70, attack: 80, defense: 70, speed: 65,
    movepool: [
        { move_id: Claw.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 2 },
        { move_id: Cut.id, levelMin: 4 },
        { move_id: Harden.id, levelMin: 6 },
        { move_id: QuickAttack.id, levelMin: 7 },
        { move_id: ClawCombo.id, levelMin: 8 },
        { move_id: Cleanse.id, levelMin: 10 },
        { move_id: Slash.id, levelMin: 14 },
    ],
    nextEvolution: null, catchRate: 35, expYield: 96, rarity: Rarity.Uncommon,
};

const Mousy: BlastData = { // NORMAL
    id: 6,
    type: Type.Normal,
    hp: 50, mana: 75, attack: 75, defense: 70, speed: 80,
    movepool: [
        { move_id: Claw.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 2 },
        { move_id: Cut.id, levelMin: 4 },
        { move_id: Harden.id, levelMin: 6 },
        { move_id: Cleanse.id, levelMin: 8 },
        { move_id: ClawCombo.id, levelMin: 12 },
        { move_id: Slash.id, levelMin: 14 },
        { move_id: QuickAttack.id, levelMin: 16 },
    ],
    nextEvolution: null, catchRate: 40, expYield: 128, rarity: Rarity.Common,
};

const Clawball: BlastData = { // NORMAL (GROUND n'a pas d'attaque dédiée)
    id: 7,
    type: Type.Ground,
    hp: 47, mana: 70, attack: 75, defense: 80, speed: 65,
    movepool: [
        { move_id: Claw.id, levelMin: 0 },
        { move_id: QuickAttack.id, levelMin: 2 },
        { move_id: Cut.id, levelMin: 4 },
        { move_id: Harden.id, levelMin: 6 },
        { move_id: Cleanse.id, levelMin: 8 },
        { move_id: ClawCombo.id, levelMin: 12 },
        { move_id: Slash.id, levelMin: 14 },
        { move_id: Growl.id, levelMin: 16 },
        { move_id: Stomp.id, levelMin: 20 },
        { move_id: Slam.id, levelMin: 22 },
        { move_id: Harden.id, levelMin: 26 },
        { move_id: Cleanse.id, levelMin: 32 },
    ],
    nextEvolution: null, catchRate: 45, expYield: 90, rarity: Rarity.Uncommon,
};

const Balt: BlastData = { // NORMAL (FLY n'a pas d'attaque dédiée)
    id: 8,
    type: Type.Fly,
    hp: 70, mana: 80, attack: 75, defense: 70, speed: 85,
    movepool: [
        { move_id: Tackle.id, levelMin: 0 },
        { move_id: QuickAttack.id, levelMin: 4 },
        { move_id: Stomp.id, levelMin: 8 },
        { move_id: Harden.id, levelMin: 12 },
    ],
    nextEvolution: null, catchRate: 50, expYield: 96, rarity: Rarity.Common,
};

const Stagpan: BlastData = { // NORMAL
    id: 9,
    type: Type.Normal,
    hp: 75, mana: 70, attack: 80, defense: 65, speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Stomp.id, levelMin: 4 },
        { move_id: Slam.id, levelMin: 8 },
        { move_id: QuickAttack.id, levelMin: 12 },
    ],
    nextEvolution: null, catchRate: 30, expYield: 64, rarity: Rarity.Common,
};

const Botte: BlastData = { // NORMAL (GROUND n'a pas d'attaque dédiée)
    id: 10,
    type: Type.Ground,
    hp: 80, mana: 75, attack: 70, defense: 85, speed: 65,
    movepool: [
        { move_id: Growl.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 4 },
        { move_id: Cleanse.id, levelMin: 8 },
        { move_id: Tackle.id, levelMin: 12 },
    ],
    nextEvolution: null, catchRate: 35, expYield: 128, rarity: Rarity.Rare,
};

const Booh: BlastData = { // NORMAL
    id: 11,
    type: Type.Normal,
    hp: 70, mana: 75, attack: 65, defense: 70, speed: 80,
    movepool: [
        { move_id: Slash.id, levelMin: 0 },
        { move_id: Cut.id, levelMin: 4 },
        { move_id: Claw.id, levelMin: 8 },
        { move_id: ClawCombo.id, levelMin: 12 },
    ],
    nextEvolution: null, catchRate: 40, expYield: 128, rarity: Rarity.Uncommon,
};

const Ghoosto: BlastData = { // NORMAL
    id: 12,
    type: Type.Normal,
    hp: 75, mana: 70, attack: 80, defense: 65, speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Slam.id, levelMin: 4 },
        { move_id: QuickAttack.id, levelMin: 8 },
        { move_id: Growl.id, levelMin: 12 },
    ],
    nextEvolution: null, catchRate: 45, expYield: 160, rarity: Rarity.Rare,
};

const Goblin: BlastData = { // NORMAL
    id: 13,
    type: Type.Normal,
    hp: 70, mana: 75, attack: 75, defense: 70, speed: 80,
    movepool: [
        { move_id: Stomp.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 4 },
        { move_id: Cleanse.id, levelMin: 8 },
        { move_id: Tackle.id, levelMin: 12 },
    ],
    nextEvolution: null, catchRate: 35, expYield: 256, rarity: Rarity.Common,
};

const MiniDevil: BlastData = { // NORMAL
    id: 14,
    type: Type.Normal,
    hp: 75, mana: 70, attack: 80, defense: 65, speed: 70,
    movepool: [
        { move_id: Slash.id, levelMin: 0 },
        { move_id: Cut.id, levelMin: 4 },
        { move_id: Claw.id, levelMin: 8 },
        { move_id: ClawCombo.id, levelMin: 12 },
    ],
    nextEvolution: null, catchRate: 40, expYield: 96, rarity: Rarity.Uncommon,
};

const DevilDare: BlastData = { // DevilDare
    id: 15,
    type: Type.Normal,
    hp: 80,
    mana: 75,
    attack: 70,
    defense: 85,
    speed: 65,
    movepool: [
        { move_id: Slam.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
        { move_id: FireBlast.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 128,
    rarity: Rarity.Rare,
};

const Masks: BlastData = { // Masks
    id: 16,
    type: Type.Normal,
    hp: 70,
    mana: 75,
    attack: 65,
    defense: 70,
    speed: 80,
    movepool: [
        { move_id: QuickAttack.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 50,
    expYield: 128,
    rarity: Rarity.Rare,
};

const Luckun: BlastData = { // Luckun
    id: 17,
    type: Type.Normal,
    hp: 75,
    mana: 70,
    attack: 80,
    defense: 65,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 30,
    expYield: 256,
    rarity: Rarity.Rare,
};

const MiniHam: BlastData = { // MiniHam
    id: 18,
    type: Type.Normal,
    hp: 70,
    mana: 75,
    attack: 65,
    defense: 70,
    speed: 80,
    movepool: [
        { move_id: Tackle.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
        { move_id: Slam.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 35,
    expYield: 64,
    rarity: Rarity.Uncommon,
};

const SadHam: BlastData = { // SadHam
    id: 19,
    type: Type.Normal,
    hp: 75,
    mana: 70,
    attack: 80,
    defense: 65,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 40,
    expYield: 128,
    rarity: Rarity.Rare,
};

const MoiHam: BlastData = { // MoiHam
    id: 20,
    type: Type.Normal,
    hp: 80,
    mana: 75,
    attack: 70,
    defense: 85,
    speed: 65,
    movepool: [
        { move_id: Stomp.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 256,
    rarity: Rarity.Epic,
};

const Bearos: BlastData = { // Bearos
    id: 21,
    type: Type.Normal,
    hp: 70,
    mana: 75,
    attack: 65,
    defense: 70,
    speed: 80,
    movepool: [
        { move_id: Slam.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 50,
    expYield: 160,
    rarity: Rarity.Rare,
};

const Treex: BlastData = { // Treex
    id: 22,
    type: Type.Normal,
    hp: 75,
    mana: 70,
    attack: 80,
    defense: 65,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 30,
    expYield: 192,
    rarity: Rarity.Rare,
};

const Moutmout: BlastData = { // Moutmout
    id: 23,
    type: Type.Normal,
    hp: 70,
    mana: 75,
    attack: 65,
    defense: 70,
    speed: 80,
    movepool: [
        { move_id: QuickAttack.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 35,
    expYield: 128,
    rarity: Rarity.Uncommon,
};

const Piggy: BlastData = { // Piggy
    id: 24,
    type: Type.Normal,
    hp: 75,
    mana: 70,
    attack: 80,
    defense: 65,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 40,
    expYield: 160,
    rarity: Rarity.Uncommon,
};

const Bleaub: BlastData = { // Bleaub
    id: 25,
    type: Type.Normal,
    hp: 70,
    mana: 75,
    attack: 65,
    defense: 70,
    speed: 80,
    movepool: [
        { move_id: Stomp.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 80,
    rarity: Rarity.Common,
};

const Shroom: BlastData = { // Shroom
    id: 26,
    type: Type.Normal,
    hp: 75,
    mana: 70,
    attack: 80,
    defense: 65,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 50,
    expYield: 96,
    rarity: Rarity.Common,
};

const Lantern: BlastData = { // Lantern
    id: 27,
    type: Type.Water,
    hp: 70,
    mana: 75,
    attack: 65,
    defense: 70,
    speed: 80,
    movepool: [
        { move_id: AquaJet.id, levelMin: 0 },
        { move_id: Waterfall.id, levelMin: 5 },
        { move_id: HydroBlast.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 30,
    expYield: 112,
    rarity: Rarity.Common,
};

const Droplet: BlastData = { // Droplet
    id: 28,
    type: Type.Water,
    hp: 75,
    mana: 70,
    attack: 80,
    defense: 65,
    speed: 70,
    movepool: [
        { move_id: AquaJet.id, levelMin: 0 },
        { move_id: HydroTail.id, levelMin: 5 },
        { move_id: HydroBlast.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 35,
    expYield: 150,
    rarity: Rarity.Epic,
};
const Fireball: BlastData = { // Fireball
    id: 29,
    type: Type.Fire,
    hp: 80,
    mana: 60,
    attack: 90,
    defense: 50,
    speed: 70,
    movepool: [
        { move_id: Ember.id, levelMin: 0 },
        { move_id: FirePunch.id, levelMin: 5 },
        { move_id: Flamethrower.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 40,
    expYield: 150,
    rarity: Rarity.Epic,
};

const Mystical: BlastData = { // Mystical
    id: 30,
    type: Type.Light,
    hp: 75,
    mana: 65,
    attack: 85,
    defense: 55,
    speed: 75,
    movepool: [
        { move_id: QuickAttack.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 150,
    rarity: Rarity.Epic,
};

const Clover: BlastData = { // Clover
    id: 31,
    type: Type.Dark,
    hp: 70,
    mana: 70,
    attack: 80,
    defense: 60,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 50,
    expYield: 112,
    rarity: Rarity.Rare,
};

const Scorlov: BlastData = { // Scorlov
    id: 32,
    type: Type.Dark,
    hp: 85,
    mana: 55,
    attack: 75,
    defense: 65,
    speed: 70,
    movepool: [
        { move_id: Stomp.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
        { move_id: FirePunch.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 30,
    expYield: 128,
    rarity: Rarity.Rare,
};

const Wormie: BlastData = { // Wormie
    id: 33,
    type: Type.Grass,
    hp: 60,
    mana: 80,
    attack: 70,
    defense: 70,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
        { move_id: Leafs.id, levelMin: 8 },
        { move_id: RazorLeaf.id, levelMin: 12 },
        { move_id: VineWhip.id, levelMin: 16 },
    ],
    nextEvolution: null,
    catchRate: 35,
    expYield: 99,
    rarity: Rarity.Common,
};

const Skel: BlastData = { // Skel
    id: 34,
    type: Type.Dark,
    hp: 70,
    mana: 70,
    attack: 70,
    defense: 70,
    speed: 70,
    movepool: [
        { move_id: QuickAttack.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
        { move_id: Slam.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 40,
    expYield: 77,
    rarity: Rarity.Common,
};

const Frederic: BlastData = { // Frederic
    id: 35,
    type: Type.Light,
    hp: 75,
    mana: 65,
    attack: 85,
    defense: 55,
    speed: 75,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
        { move_id: QuickAttack.id, levelMin: 10 },
        { move_id: Cleanse.id, levelMin: 15 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 69,
    rarity: Rarity.Uncommon,
};

const Smoky: BlastData = { // Smoky
    id: 36,
    type: Type.Water,
    hp: 80,
    mana: 60,
    attack: 90,
    defense: 50,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
        { move_id: AquaJet.id, levelMin: 8 },
        { move_id: Waterfall.id, levelMin: 12 },
        { move_id: HydroBlast.id, levelMin: 16 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 130,
    rarity: Rarity.Uncommon,
};

const Forty: BlastData = { // Forty
    id: 37,
    type: Type.Ground,
    hp: 100,
    mana: 55,
    attack: 45,
    defense: 100,
    speed: 45,
    movepool: [
        { move_id: Stomp.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
        { move_id: Slam.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 50,
    expYield: 212,
    rarity: Rarity.Rare,
};

const Bud: BlastData = { // Bud
    id: 38,
    type: Type.Dark,
    hp: 60,
    mana: 80,
    attack: 70,
    defense: 70,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
        { move_id: Slam.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 30,
    expYield: 169,
    rarity: Rarity.Uncommon,
};

const Hiboo: BlastData = { // Hiboo
    id: 39,
    type: Type.Normal,
    hp: 90,
    mana: 100,
    attack: 80,
    defense: 90,
    speed: 100,
    movepool: [
        { move_id: QuickAttack.id, levelMin: 0 },
        { move_id: Stomp.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 35,
    expYield: 222,
    rarity: Rarity.Legendary,
};

const Eggy: BlastData = { // Eggy
    id: 40,
    type: Type.Ground,
    hp: 100,
    mana: 40,
    attack: 30,
    defense: 70,
    speed: 20,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: FirePunch.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 40,
    expYield: 118,
    rarity: Rarity.Epic,
};

const Dracoblast: BlastData = { // Dracoblast
    id: 41,
    type: Type.Fly,
    hp: 90,
    mana: 90,
    attack: 90,
    defense: 90,
    speed: 100,
    movepool: [
        { move_id: Stomp.id, levelMin: 0 },
        { move_id: Ember.id, levelMin: 5 },
        { move_id: QuickAttack.id, levelMin: 8 },
        { move_id: Flamethrower.id, levelMin: 12 },
        { move_id: Cleanse.id, levelMin: 15 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 255,
    rarity: Rarity.Legendary,
};

const Cerberus: BlastData = { // Cerberus
    id: 42,
    type: Type.Fire,
    hp: 100,
    mana: 80,
    attack: 100,
    defense: 80,
    speed: 100,
    movepool: [
        { move_id: Stomp.id, levelMin: 0 },
        { move_id: Ember.id, levelMin: 5 },
        { move_id: FirePunch.id, levelMin: 10 },
        { move_id: FireBlast.id, levelMin: 15 },
        { move_id: FlareBlitz.id, levelMin: 20 },
        { move_id: Cleanse.id, levelMin: 25 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 255,
    rarity: Rarity.Legendary,
};

const blastPedia: BlastData[] = [
    Lizzy,
    Punchball,
    Jellys,
    Kitchi,
    Kenchi,
    Mousy,
    Clawball,
    Balt,
    Stagpan,
    Botte,
    Booh,
    Ghoosto,
    Goblin,
    MiniDevil,
    DevilDare,
    Masks,
    Luckun,
    MiniHam,
    SadHam,
    MoiHam,
    Bearos,
    Treex,
    Moutmout,
    Piggy,
    Bleaub,
    Shroom,
    Lantern,
    Droplet,
    Fireball,
    Mystical,
    Clover,
    Scorlov,
    Wormie,
    Skel,
    Frederic,
    Smoky,
    Forty,
    Bud,
    Hiboo,
    Eggy,
    Dracoblast,
    Cerberus,
];

function getBlastDataById(id: number): BlastData {
    const blast = blastPedia.find((blast) => blast.id === id);
    if (!blast) {
        throw new Error(`No Blast found with ID: ${id}`);
    }
    return blast;
}

const rpcLoadBlastPedia: nkruntime.RpcFunction =
    function (ctkx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama): string {
        return JSON.stringify(blastPedia);
    }