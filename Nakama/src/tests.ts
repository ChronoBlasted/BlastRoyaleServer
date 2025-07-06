function rpcCalculateAttackDamage(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const params: CalculateDamageParams = JSON.parse(payload);

    var result:number = calculateDamage(
        params.attackerLevel, 
        params.attackerAttack, 
        params.defenderDefense, 
        params.attackType, 
        params.defenderType, 
        params.movePower, 
        params.meteo
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