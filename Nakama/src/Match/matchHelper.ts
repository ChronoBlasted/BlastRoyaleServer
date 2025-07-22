const healManaPerRound = 20;
const healManaPerWait = 50;

enum BattleState {
    None,
    Start,
    Waiting,
    Ready,
    ResolveTurn,
    WaitForPlayerSwap,
    WaitForPlayerChooseOffer,
    End,
}

enum PlayerState {
    None,
    Busy,
    Ready,
}

enum TurnType {
    None,
    Attack,
    Item,
    Swap,
    Wait,
    Status
}

interface BattleData {
    emptyTicks: number

    presences: { [userId: string]: nkruntime.Presence | null }

    battleState: BattleState;

    player1State: PlayerState;
    player1Id: string;

    p1Index: number;
    p1Blasts: BlastEntity[];

    player1Platform: Type[];

    player2State: PlayerState;
    player2Id: string;

    p2Index: number;
    p2Blasts: BlastEntity[];
    player2Platform: Type[];

    turnStateData: {
        p1TurnData: PlayerTurnData,
        p2TurnData: PlayerTurnData,
        catched: boolean;
    }

    meteo: Meteo
}

interface PlayerActionData {
    type: TurnType;
    data?: any;
}

interface PlayerTurnData {
    type: TurnType;
    moveIndex: number;
    moveDamage: number;
    moveEffects: MoveEffectData[];
}

interface StartStateData {
    newBlastData: NewBlastData;
    meteo: Meteo;
}

interface NewBlastData {
    id: number;
    exp: number;
    iv: number;
    boss: boolean;
    shiny: boolean;
    status: Status;
    activeMoveset: number[];
}

//#region Damage Calculation

function calculateDamage(
    attackerLevel: number,
    attackerAttack: number,
    defenderDefense: number,
    attackType: Type,
    defenderType: Type,
    movePower: number,
    meteo: Meteo,
    logger: nkruntime.Logger
): number {
    const weatherModifier = calculateWeatherModifier(meteo, attackType);
    const typeMultiplier = getTypeMultiplier(attackType, defenderType, logger);

    const baseDamage = ((2 * attackerLevel / 5 + 2) * movePower * (attackerAttack / defenderDefense)) / 50;

    const damage = baseDamage * typeMultiplier * weatherModifier;

    return Math.floor(damage);
}

function getTypeMultiplier(moveType: Type, defenderType: Type, logger: nkruntime.Logger): number {
    switch (moveType) {
        case Type.Fire:
            switch (defenderType) {
                case Type.Grass:
                    return 2;
                case Type.Water:
                    return 0.5;
                default:
                    return 1;
            }

        case Type.Water:
            switch (defenderType) {
                case Type.Fire:
                    return 2;
                case Type.Grass:
                    return 0.5;
                default:
                    return 1;
            }

        case Type.Grass:
            switch (defenderType) {
                case Type.Water:
                    return 2;
                case Type.Fire:
                    return 0.5;
                default:
                    return 1;
            }

        case Type.Normal:
            switch (defenderType) {
                case Type.Light:
                    return 0.5;
                case Type.Dark:
                    return 0.5;
                default:
                    return 1;
            }

        case Type.Ground:
            switch (defenderType) {
                case Type.Electric:
                    return 2;
                case Type.Fly:
                    return 0;
                default:
                    return 1;
            }

        case Type.Fly:
            switch (defenderType) {
                case Type.Electric:
                    return 0;
                case Type.Ground:
                    return 2;
                default:
                    return 1;
            }

        case Type.Electric:
            switch (defenderType) {
                case Type.Ground:
                    return 0;
                case Type.Fly:
                    return 2;
                default:
                    return 1;
            }

        case Type.Light:
            switch (defenderType) {
                case Type.Dark:
                    return 2;
                case Type.Normal:
                    return 2;
                case Type.Light:
                    return 0.5;
                default:
                    return 1;
            }

        case Type.Dark:
            switch (defenderType) {
                case Type.Light:
                    return 2;
                case Type.Normal:
                    return 2;
                case Type.Dark:
                    return 0.5;
                default:
                    return 1;
            }

        default:
            return 1;
    }
}

function calculateWeatherModifier(weather: Meteo, moveType: Type): number {
    let modifier = 1.0;

    switch (weather) {
        case Meteo.Sun:
            if (moveType === Type.Fire) {
                modifier = 1.5;
            }
            break;

        case Meteo.Rain:
            if (moveType === Type.Water) {
                modifier = 1.5;
            }
            break;

        case Meteo.Leaves:
            if (moveType === Type.Grass) {
                modifier = 1.5;
            }

            break;

        case Meteo.None:
            break;
    }

    return modifier;
}

function calculateEffectWithProbability(blast: BlastEntity, move: Move, effectData: MoveEffectData): { blast: BlastEntity, moveEffect: MoveEffectData } {
    const statusEffectProbabilities: { [key in MoveEffect]?: number } = {
        [MoveEffect.Burn]: 0.1,
        [MoveEffect.Seeded]: 0.1,
        [MoveEffect.Wet]: 0.1,
        [MoveEffect.ManaExplosion]: 0.2,
        [MoveEffect.HpExplosion]: 0.2,
        [MoveEffect.ManaRestore]: 0.2,
        [MoveEffect.HpRestore]: 0.2,
        [MoveEffect.AttackBoost]: 0.5,
        [MoveEffect.DefenseBoost]: 0.5,
        [MoveEffect.SpeedBoost]: 0.5,
        [MoveEffect.AttackReduce]: 0.5,
        [MoveEffect.DefenseReduce]: 0.5,
        [MoveEffect.SpeedReduce]: 0.5,
        [MoveEffect.Cleanse]: 0.5,
    };

    const effectProbability = statusEffectProbabilities[effectData.effect!];
    if (Math.random() < effectProbability!) {
        return { blast: applyEffect(blast, move, effectData), moveEffect: effectData! };
    }

    return { blast, moveEffect: { effect: MoveEffect.None, effectModifier: 0, effectTarget: Target.None } };
}

function applyEffect(blast: BlastEntity, move: Move, effectData: MoveEffectData): BlastEntity {

    var isStatusMove = move.attackType === AttackType.Status;

    switch (effectData.effect) {
        case MoveEffect.Burn:
            blast.status = Status.Burn;
            break;
        case MoveEffect.Seeded:
            blast.status = Status.Seeded;
            break;
        case MoveEffect.Wet:
            blast.status = Status.Wet;
            break;

        case MoveEffect.ManaExplosion:
            const manaDmg = Math.floor(blast.maxMana / 2);
            blast.hp = Math.max(0, blast.hp - manaDmg);
            blast.mana = Math.floor(blast.mana / 2);
            break;
        case MoveEffect.HpExplosion:
            const hpCost = Math.floor(blast.maxHp / 3);
            blast.hp = Math.max(0, blast.hp - hpCost);
            break;

        case MoveEffect.ManaRestore:
            blast.mana = Math.min(blast.maxMana, blast.mana + move.power);
            break;
        case MoveEffect.HpRestore:
            blast.hp = Math.min(blast.maxHp, blast.hp + move.power);
            break;

        case MoveEffect.AttackBoost:
            blast.modifiers = updateStatModifier(blast.modifiers, Stats.Attack, isStatusMove ? effectData.effectModifier : 1);
            break;
        case MoveEffect.DefenseBoost:
            blast.modifiers = updateStatModifier(blast.modifiers, Stats.Defense, isStatusMove ? effectData.effectModifier : 1);

            break;
        case MoveEffect.SpeedBoost:
            blast.modifiers = updateStatModifier(blast.modifiers, Stats.Speed, isStatusMove ? effectData.effectModifier : 1);
            break;
        case MoveEffect.AttackReduce:
            blast.modifiers = updateStatModifier(blast.modifiers, Stats.Attack, isStatusMove ? -effectData.effectModifier : -1);
            break;
        case MoveEffect.DefenseReduce:
            blast.modifiers = updateStatModifier(blast.modifiers, Stats.Defense, isStatusMove ? -effectData.effectModifier : -1);
            break;
        case MoveEffect.SpeedReduce:
            blast.modifiers = updateStatModifier(blast.modifiers, Stats.Speed, isStatusMove ? -effectData.effectModifier : -1);
            break;

        case MoveEffect.Cleanse:
            blast.status = Status.None;
            break;
    }

    return blast;
}

function getStatModifier(stat: Stats, modifiers: modifierBlastStruct[]): number {
    var modifier = modifiers.find(m => m.stats === stat);
    if (!modifier) return 1;

    const amount = modifier.amount;
    if (amount > 0) {
        if (amount === 1) return 1.5;
        if (amount === 2) return 2;
        return 3;
    } else if (amount < 0) {
        if (amount === -1) return 0.8;
        if (amount === -2) return 0.6;
        return 0.2;
    }

    return 1;
}

function updateStatModifier(mods: modifierBlastStruct[], stat: Stats, delta: number): modifierBlastStruct[] {

    const index = mods.findIndex((m) => m.stats === stat);

    if (index >= 0) {
        mods[index].amount += delta;
        if (mods[index].amount <= 0) mods.splice(index, 1);
    } else if (delta > 0) {
        mods.push({ stats: stat, amount: delta });
    }
    return mods;
}

function applyStatusEffectAtEndOfTurn(blast: BlastEntity, otherBlast: BlastEntity): { blast: BlastEntity, otherBlast: BlastEntity } {
    switch (blast.status) {
        case Status.Burn:
            blast.hp = Math.max(0, blast.hp - Math.floor(blast.maxHp / 16));
            break;

        case Status.Seeded:
            const healAmount = Math.floor(blast.maxHp / 16);

            blast.hp = Math.max(0, blast.hp - healAmount);
            otherBlast.hp = Math.min(otherBlast.maxHp, otherBlast.hp + healAmount);
            break;

        case Status.Wet:
            blast.mana = Math.max(0, blast.mana - Math.floor(blast.maxMana / 32));
            break;
        default:
            break;
    }

    return { blast, otherBlast };
}

function addPlatformType(p_platform: Type[], newType: Type): Type[] {
    if (p_platform.length < 3) {
        p_platform.push(newType);
    } else {
        p_platform.shift();
        p_platform.push(newType);
    }

    return p_platform;
}

function getAmountOfPlatformTypeByType(p_platform: Type[], typeToCount: Type): number {
    return p_platform.filter(type => type === typeToCount).length;
}

function removePlatformTypeByType(p_platform: Type[], typeToRemove: Type, numberToRemove: number): Type[] {
    let removedCount = 0;

    for (let i = p_platform.length - 1; i >= 0 && removedCount < numberToRemove; i--) {
        if (p_platform[i] === typeToRemove) {
            p_platform.splice(i, 1);
            removedCount++;
        }
    }

    return p_platform;
}

//#region Health and Mana and Status

function isAllBlastDead(allPlayerBlasts: BlastEntity[]): boolean {
    return allPlayerBlasts.every((blast) => blast.hp === 0);
}

function isBlastAlive(blast: BlastEntity): boolean {
    return blast.hp > 0;
}

function calculateManaRecovery(
    maxMana: number,
    currentMana: number,
    useWait: boolean = false
): number {
    const normalRecovery: number = Math.floor(maxMana * 0.2);
    const waitRecovery: number = Math.floor(maxMana * 0.5);

    let recoveredMana: number = currentMana + (useWait ? waitRecovery : normalRecovery);

    if (recoveredMana > maxMana) {
        recoveredMana = maxMana;
    }

    return recoveredMana;
}

function healHealthBlast(blast: BlastEntity, amount: number): BlastEntity {
    blast.hp += amount;

    if (blast.hp > blast.maxHp) blast.hp = blast.maxHp;

    return blast;
}

function healManaBlast(blast: BlastEntity, amount: number): BlastEntity {
    blast.mana += amount;

    if (blast.mana > blast.maxMana) blast.mana = blast.maxMana;

    return blast;
}

function healStatusBlast(blast: BlastEntity, status: Status): BlastEntity {
    if (blast.status == status || status == Status.All) blast.status = Status.None;

    return blast;
}

// #region round logic

function getFasterBlast(blast1: BlastEntity, blast2: BlastEntity): boolean {

    return blast1.speed > blast2.speed;
}

function getRandomMeteo(): Meteo {
    const values = Object.values(Meteo).filter(value => typeof value === "number") as Meteo[];
    return randomElement(values);
}

function getRandomUsableMove(allMoves: Move[], currentMana: number, currentPlatformTypes: Type[]): number {
    const usableMoves: Move[] = [];

    for (const move of allMoves) {
        switch (move.attackType) {
            case AttackType.Normal:
            case AttackType.Status:
                if (currentMana < move.cost) continue;
                break;

            case AttackType.Special: {
                const energyCount = getAmountOfPlatformTypeByType(currentPlatformTypes, move.type);
                if (energyCount < move.cost) continue;
                break;
            }
        }

        usableMoves.push(move);
    }

    if (usableMoves.length === 0) {
        return -1;
    }

    const randomIndex = Math.floor(Math.random() * usableMoves.length);
    return allMoves.indexOf(usableMoves[randomIndex]);
}

// #region Others

function addExpOnBlastInGame(nk: nkruntime.Nakama, logger: nkruntime.Logger, playerId: string, currentPlayerBlast: Blast, enemyBlast: Blast) {
    let expToAdd = calculateExperienceGain(getBlastDataById(currentPlayerBlast.data_id).expYield, calculateLevelFromExperience(enemyBlast.exp), calculateLevelFromExperience(currentPlayerBlast.exp));
    addExpOnBlast(nk, logger, playerId, currentPlayerBlast.uuid, expToAdd);
}

function calculateCaptureProbability(currentHP: number, maxHP: number, catchRate: number, trapBonus: number, statusBonus: number): number {
    const hpFactor = (3 * maxHP - 2 * currentHP) / (3 * maxHP);
    const baseProbability = catchRate * hpFactor * trapBonus * statusBonus;

    const captureProbability = Math.min(Math.max(baseProbability, 0), 1);

    return captureProbability;
}

function isBlastCaptured(
    currentHP: number,
    maxHP: number,
    catchRate: number,
    trapBonus: number,
    statusBonus: number
): boolean {
    const captureProbability = calculateCaptureProbability(currentHP, maxHP, catchRate, trapBonus, statusBonus) * 100;

    const randomValue = Math.random() * 100;

    return randomValue <= captureProbability;
}

function isShiny(probability: number = 1 / 1024): boolean {
    return Math.random() < probability;
}

function EndLoopDebug(logger: nkruntime.Logger, state: BattleData) {
    logger.debug('______________ END LOOP BATTLE ______________');
    logger.debug('Wild blast HP : %h, Mana : %m', state.p2Blasts?.[state.p2Index].hp, state.p2Blasts?.[state.p2Index].mana);
    logger.debug('Player blast HP : %h, Mana : %m', state.p1Blasts[state.p1Index]?.hp, state.p1Blasts[state.p1Index]?.mana);
}