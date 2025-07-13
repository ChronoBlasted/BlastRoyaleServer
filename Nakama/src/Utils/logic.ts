

function calculateBlastStat(baseStat: number, iv: number, level: number): number {
    return Math.floor(((baseStat + iv) * level) / 100) + 5;
}

function calculateBlastHp(baseHp: number, iv: number, level: number): number {
    return Math.floor(((baseHp + iv) * level) / 100) + level + 10;
}

function calculateBlastMana(baseMana: number, iv: number, level: number): number {
    return Math.floor(((baseMana + iv) * level) / 100) + 10;
}

function calculateLevelFromExperience(experience: number): number {
    if (experience < 0) {
        throw new Error("L'expérience totale ne peut pas être négative.");
    }

    return Math.floor(Math.cbrt(experience));
}

function calculateExperienceFromLevel(level: number): number {
    if (level < 1 || level > 100) {
        throw new Error("Le niveau doit être compris entre 1 et 100. Le level : " + level);
    }

    return Math.pow(level, 3);
}

function calculateExperienceGain(expYield: number, enemyLevel: number, yourLevel: number): number {
    const experience: number = Math.floor(((expYield * enemyLevel / 7) * ((2 * enemyLevel + 10) / (enemyLevel + yourLevel + 10)) + 1));
    return experience;
}

function getRandomActiveMoveset(blastData: BlastData, exp: number): number[] {

    const availableMoves = blastData.movepool
        .filter(m => calculateLevelFromExperience(exp) >= m.levelMin)
        .map(m => m.move_id);

    const shuffledMoves = shuffleArray(availableMoves);
    const randomMoveset = shuffledMoves.slice(0, 4);

    return randomMoveset;
}

function ConvertBlastToBlastEntity(blast: Blast): BlastEntity {
    const blastEntity: BlastEntity = new BlastEntity(blast.uuid, blast.data_id, blast.exp, blast.iv, blast.boss, blast.shiny, blast.activeMoveset);

    return blastEntity as BlastEntity;
}

// region Utils


function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function getRandomNumber(min: number, max: number): number {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1)) + minCeiled;
}

function randomElement<T>(array: T[]): T {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function msecToSec(n: number): number {
    return Math.floor(n / 1000);
}

function isDailyResetDue(lastResetUnix: number): boolean {
  if (!lastResetUnix) lastResetUnix = 0;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return lastResetUnix < msecToSec(now.getTime());
}


function getBlastVersion(blast: Blast) : number {

    if (blast.shiny) {
        return 3;
    } else if (blast.boss) {
        return 2;
    } else {
        return 1;
    }
}

function parseEnum<T>(value: string, enumObj: any): T {
    const enumValue = enumObj[value];
    if (typeof enumValue === "number") return enumValue as T;
    throw new Error(`Invalid enum value '${value}' for enum ${JSON.stringify(enumObj)}`);
}
