const DailyRewardPermissionRead = 2;
const DailyRewardPermissionWrite = 0;
const DailyRewardCollectionName = 'reward';
const DailyRewardCollectionKey = 'daily';

interface Reward {
    type: RewardType
    amount?: number
    blast?: Blast
    item?: Item
}

interface DailyRewardData {
    lastClaimUnix: number;
    totalDay: number;
    version?: string;
}

function getLastDailyRewardObject(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): any {
    if (!context.userId) {
        throw Error('No user ID in context');
    }

    if (payload) {
        throw Error('No input allowed');
    }

    var objectId: nkruntime.StorageReadRequest = {
        collection: DailyRewardCollectionName,
        key: DailyRewardCollectionKey,
        userId: context.userId,
    }

    var objects: nkruntime.StorageObject[];
    try {
        objects = nk.storageRead([objectId]);
    } catch (error) {
        logger.error('storageRead error: %s', error);
        throw error;
    }

    var dailyReward: DailyRewardData = {
        lastClaimUnix: 0,
        totalDay: 0,
    };

    objects.forEach(function (object) {
        if (object.key == DailyRewardCollectionKey) {
            dailyReward = object.value as DailyRewardData;
        }
    });

    return dailyReward;
}


function getTotalDayConnected(dailyReward: any): number {
    if (!dailyReward.totalDay) {
        dailyReward.totalDay = 0;
    }

    return dailyReward.totalDay;
}

function rpcCanClaimDailyReward(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    var dailyReward = getLastDailyRewardObject(context, logger, nk, payload);
    var response = {
        canClaimDailyReward: isDailyResetDue(dailyReward.lastClaimUnix),
        totalDayConnected: dailyReward.totalDay,
    }

    var result = JSON.stringify(response);
    logger.debug('rpcCanClaimDailyReward response: %q', result);

    return result;
}


function rpcClaimDailyReward(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {

    var reward: Reward = {
        type: RewardType.None
    };

    var dailyReward = getLastDailyRewardObject(context, logger, nk, payload) as DailyRewardData;

    if (isDailyResetDue(dailyReward.lastClaimUnix)) {

        var totalDay = getTotalDayConnected(dailyReward);
        reward = getDayReward(totalDay);

        var notification: nkruntime.NotificationRequest = {
            code: notificationOpCodes.CURENCY,
            content: reward,
            persistent: false,
            subject: "You've received a new item",
            userId: context.userId,
        }

        if (reward.type == RewardType.Coin) {
            updateWalletWithCurrency(nk, context.userId, Currency.Coins, reward.amount!,logger);

            notification = {
                code: notificationOpCodes.CURENCY,
                content: reward,
                persistent: false,
                subject: "You've received a new currency",
                userId: context.userId,
            }

            try {
                nk.notificationsSend([notification]);
            } catch (error) {
                logger.error('notificationsSend error: %q', error);
                throw error;
            }

        }
        if (reward.type == RewardType.Gem) {
            updateWalletWithCurrency(nk, context.userId, Currency.Gems, reward.amount!,logger);

            notification = {
                code: notificationOpCodes.CURENCY,
                content: reward,
                persistent: false,
                subject: "You've received a new currency",
                userId: context.userId,
            }

            try {
                nk.notificationsSend([notification]);
            } catch (error) {
                logger.error('notificationsSend error: %q', error);
                throw error;
            }
        }

        if (reward.type == RewardType.Blast) {
            addBlast(nk, logger, context.userId, reward.blast!);
        }

        if (reward.type == RewardType.Item) {
            addItem(nk, logger, context.userId, reward.item!);
        }

        dailyReward.lastClaimUnix = msecToSec(Date.now());
        dailyReward.totalDay = totalDay + 1;

        var write: nkruntime.StorageWriteRequest = {
            collection: DailyRewardCollectionName,
            key: DailyRewardCollectionKey,
            permissionRead: DailyRewardPermissionRead,
            permissionWrite: DailyRewardPermissionWrite,
            value: dailyReward,
            userId: context.userId,
        }

        if (dailyReward.version) {
            write.version = dailyReward.version
        }

        // Update daily reward storage object for user.
        try {
            nk.storageWrite([write])
        } catch (error) {
            logger.error('storageWrite error: %q', error);
            throw error;
        }
    }

    var result = JSON.stringify(reward);
    logger.debug('rpcClaimDailyReward response: %q', result)

    return result;
}

function getDayReward(totalDay: number): Reward {
    return allReward[totalDay % allReward.length];
}


// Data

const allReward: Reward[] = [
    { type:RewardType.Gem, amount: 5 },
    { type:RewardType.Coin, amount: 750 },
    { type:RewardType.Gem, amount: 15 },
    { type:RewardType.Coin, amount: 2000 },
    { type:RewardType.Gem, amount: 30 },
    { type:RewardType.Coin, amount: 5000 },
    {
        type:RewardType.Blast,blast: {
            uuid: generateUUID(),
            data_id: Clawball.id,
            exp: calculateExperienceFromLevel(10),
            iv: getRandomIV(),
            boss: false,
            shiny: true,
            activeMoveset: getRandomActiveMoveset(Clawball, calculateExperienceFromLevel(10))
        }
    },
];

const rpcLoadAllDailyReward: nkruntime.RpcFunction =
    function (): string {
        return JSON.stringify(allReward);
    }

