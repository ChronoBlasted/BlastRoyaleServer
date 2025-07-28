const DailyQuestPermissionRead = 2;
const DailyQuestPermissionWrite = 0;
const DailyQuestCollectionName = "daily_quests";
const DailyQuestStorageKey = "daily_quests_key";

enum QuestType {
  Login,
  DefeatBlast,
  CatchBlast,
  WatchAd,
}

const DefaultQuest: QuestData[] = [

  {
    questType: QuestType.Login,
    goal: 1,
  },
  {
    questType: QuestType.DefeatBlast,
    goal: 5,
  },
  {
    questType: QuestType.CatchBlast,
    goal: 2,
  },
  {
    questType: QuestType.WatchAd,
    goal: 1,
  },
]

type QuestData = {
  questType: QuestType
  goal: number;
};


interface DailyQuest {
  type: QuestType;
  goal: number;
  progress: number;
}

interface AllQuestData {
  quests: DailyQuest[];
  lastReset: number;
  rewardCount: number;
}

function generateDailyQuests(): AllQuestData {
  return {
    quests: DefaultQuest.map((def): DailyQuest => ({
      type: def.questType,
      goal: def.goal,
      progress: 0,
    })),
    lastReset: Date.now(),
    rewardCount: 0,
  };
}

function createDailyQuestStorageIfNeeded(userId: string, nk: nkruntime.Nakama, logger: nkruntime.Logger): void {
  const records = nk.storageRead([{
    collection: DailyQuestCollectionName,
    key: DailyQuestStorageKey,
    userId
  }]);

  if (records.length === 0) {
    const dailyData = generateDailyQuests();
    nk.storageWrite([{
      collection: DailyQuestCollectionName,
      key: DailyQuestStorageKey,
      userId,
      value: dailyData,
      permissionRead: DailyQuestPermissionRead,
      permissionWrite: DailyQuestPermissionWrite
    }]);
    logger.debug(`createDailyQuestStorageIfNeeded: Created daily quest storage for userId=${userId}`);
  } else {
    logger.debug(`createDailyQuestStorageIfNeeded: Storage already exists for userId=${userId}`);
  }
}

function rpcGetDailyQuests(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  const userId = context.userId;

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  const records = nk.storageRead([{
    collection: DailyQuestCollectionName,
    key: DailyQuestStorageKey,
    userId
  }]);

  let dailyData: AllQuestData;

  dailyData = records[0].value as AllQuestData;

  if (isDailyResetDue(dailyData.lastReset)) {
    dailyData = generateDailyQuests();

    nk.storageWrite([{
      collection: DailyQuestCollectionName,
      key: DailyQuestStorageKey,
      userId,
      value: dailyData,
      permissionRead: DailyQuestPermissionRead,
      permissionWrite: DailyQuestPermissionWrite
    }]);
    logger.debug(`rpcGetDailyQuests: Reset daily quest storage for userId=${userId}`);
  }

  const result = JSON.stringify(dailyData.quests);
  logger.debug("rpcGetDailyQuests response: %q", result);
  return result;
}

function incrementQuest(userId: string, questType: QuestType, amount: number, nk: nkruntime.Nakama, logger: nkruntime.Logger) {
  const records = nk.storageRead([{
    collection: DailyQuestCollectionName,
    key: DailyQuestStorageKey,
    userId
  }]);

  if (!records.length) {
    logger.debug(`incrementQuest: No daily quest record found for userId=${userId}`);
    return;
  }

  const record = records[0];
  const data = record.value as AllQuestData;
  const version = record.version;

  const quest = data.quests.find((q: DailyQuest) => q.type === questType);
  if (!quest) {
    logger.debug(`incrementQuest: Quest with type=${questType} not found for userId=${userId}`);
    return;
  }

  const oldProgress = quest.progress;
  quest.progress = Math.min(quest.goal, quest.progress + amount);
  logger.debug(`incrementQuest: Updated quest '${questType}' for userId=${userId} from progress=${oldProgress} to progress=${quest.progress} (goal=${quest.goal})`);

  const writeRequest: nkruntime.StorageWriteRequest = {
    collection: DailyQuestCollectionName,
    key: DailyQuestStorageKey,
    userId: userId,
    value: data,
    version: version,
    permissionRead: DailyQuestPermissionRead,
    permissionWrite: DailyQuestPermissionWrite,
  };

  try {
    nk.storageWrite([writeRequest]);
    logger.debug(`incrementQuest: Successfully wrote updated quest data for userId=${userId}`);
  } catch (error) {
    logger.error("incrementQuest storageWrite error: %q", error);
    throw error;
  }
}

function rpcClaimDailyQuestReward(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {

  const records = nk.storageRead([{ collection: DailyQuestCollectionName, key: DailyQuestStorageKey, userId: context.userId }]);
  if (!records.length) throw new Error("No daily quests foundddd");

  const data = records[0].value as AllQuestData;
  const version = records[0].version;

  const finishedCount = data.quests.filter(q => q.progress >= q.goal).length;

  if (finishedCount <= data.rewardCount) {
    throw new Error("No rewards to claim");
  }

  const reward = rewardList[data.rewardCount];

  if (reward.type == RewardType.Coin) {
    updateWalletWithCurrency(nk, context.userId, Currency.Coins, reward.amount!, logger);
  }

  if (reward.type == RewardType.Gem) {
    updateWalletWithCurrency(nk, context.userId, Currency.Gems, reward.amount!, logger);
  }

  data.rewardCount++;

  try {
    nk.storageWrite([{
      collection: DailyQuestCollectionName,
      key: DailyQuestStorageKey,
      userId: context.userId,
      value: data,
      version,
      permissionRead: DailyQuestPermissionRead,
      permissionWrite: DailyQuestPermissionWrite,
    }]);
  } catch (error) {
    logger.error("claimReward storageWrite error: %q", error);
    throw error;
  }

  return JSON.stringify(reward);
}

function rpcGetDailyQuestRewards(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  const userId = context.userId;
  if (!userId) throw new Error("User not authenticated.");

  const records = nk.storageRead([{
    collection: DailyQuestCollectionName,
    key: DailyQuestStorageKey,
    userId
  }]);

  if (!records.length) throw new Error("No daily quest record found for userId=" + userId);

  const data = records[0].value as AllQuestData;

  const response = {
    rewards: rewardList,
    rewardCount: data.rewardCount
  };

  logger.debug(`rpcGetDailyQuestRewards: userId=${userId} rewardCount=${data.rewardCount}`);
  return JSON.stringify(response);
}


const rewardList: Reward[] = [
  { type: RewardType.Gem, amount: 2 },
  { type: RewardType.Coin, amount: 2000 },
  { type: RewardType.Coin, amount: 5000 },
  { type: RewardType.Gem, amount: 5 },
];

