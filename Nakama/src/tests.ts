function rpcCalculateAttackDamage(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const raw = JSON.parse(payload);

    const params: CalculateDamageParams = {
        attackerLevel: raw.attackerLevel,
        attackerAttack: raw.attackerAttack,
        defenderDefense: raw.defenderDefense,
        attackType: parseEnum<Type>(raw.attackType, Type),
        defenderType: parseEnum<Type>(raw.defenderType, Type),
        movePower: raw.movePower,
        meteo: parseEnum<Meteo>(raw.meteo, Meteo),
    };

    var result = calculateDamage(
        params.attackerLevel,
        params.attackerAttack,
        params.defenderDefense,
        params.attackType,
        params.defenderType,
        params.movePower,
        params.meteo,
        logger
    );

    return JSON.stringify(result);
}

interface CalculateDamageParams {
    attackerLevel: number;
    attackerAttack: number;
    defenderDefense: number;
    attackType: Type;
    defenderType: Type;
    movePower: number;
    meteo: Meteo;
}