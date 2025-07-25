enum Currency {
  None,
  Coins = "Coins",
  Gems = "Gems",
  Trophies = "Trophies",
  Hard = "Hard",
};

enum notificationOpCodes {
  CURENCY = 1000,
  BLAST = 1010,
  ITEM = 1020,
}

let DefaultWallet = {
  [Currency.Coins]: 1000,
  [Currency.Gems]: 100,
  [Currency.Trophies]: 0,
};

function storeUserWallet(nk: nkruntime.Nakama, user_id: string, changeset: { Coins: number; Gems: number; Trophies: number; }, logger: nkruntime.Logger) {
  try {
    nk.walletUpdate(user_id, changeset);
  } catch (error) {
    logger.error('Error storing wallet of player : %s', user_id);
  }
}

function updateWalletWithCurrency(
  nk: nkruntime.Nakama,
  userId: string,
  currencyKeyName: Currency,
  amount: number,
  logger: nkruntime.Logger
): nkruntime.WalletUpdateResult | null {
  amount = Math.trunc(amount);

  const currentAmount = getCurrencyInWallet(nk, userId, currencyKeyName) ?? 0;

  if (amount < 0) {
    const maxRemovable = Math.min(currentAmount, -amount);
    amount = -maxRemovable;
  }

  if (amount === 0) {
    logger.debug("Wallet update skipped: amount is 0 for user %s and currency %s", userId, currencyKeyName);
    return null;
  }


  return nk.walletUpdate(userId, { [currencyKeyName]: amount });
}




function getCurrencyInWallet(
  nk: nkruntime.Nakama,
  userId: string,
  currencyKeyName: Currency
): number {
  try {
    const account = nk.accountGetId(userId);
    const wallet = account.wallet;
    return wallet[currencyKeyName] ?? 0;
  } catch (error) {
    return 0;
  }
}
