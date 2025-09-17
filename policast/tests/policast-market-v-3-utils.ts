import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import {
  AdminLiquidityWithdrawn,
  BComputed,
  BatchWinningsDistributed,
  BettingTokenUpdated,
  Claimed,
  FeeAccrued,
  FeeCollected,
  FeeCollectorUpdated,
  FeesUnlocked,
  FreeMarketConfigSet,
  FreeTokensClaimed,
  LiquidityAdded,
  MarketCreated,
  MarketDisputed,
  MarketInvalidated,
  MarketPaused,
  MarketResolved,
  MarketValidated,
  OwnershipTransferred,
  Paused,
  PlatformFeesWithdrawn,
  PricesUpdated,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  SharesSold,
  SlippageProtect,
  TradeExecuted,
  Unpaused,
  UserPortfolioUpdated,
  WinningsDistributedToUser
} from "../generated/PolicastMarketV3/PolicastMarketV3"

export function createAdminLiquidityWithdrawnEvent(
  marketId: BigInt,
  creator: Address,
  amount: BigInt
): AdminLiquidityWithdrawn {
  let adminLiquidityWithdrawnEvent =
    changetype<AdminLiquidityWithdrawn>(newMockEvent())

  adminLiquidityWithdrawnEvent.parameters = new Array()

  adminLiquidityWithdrawnEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  adminLiquidityWithdrawnEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  adminLiquidityWithdrawnEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return adminLiquidityWithdrawnEvent
}

export function createBComputedEvent(
  marketId: BigInt,
  bValue: BigInt,
  coverageRatioNum: BigInt,
  coverageRatioDen: BigInt
): BComputed {
  let bComputedEvent = changetype<BComputed>(newMockEvent())

  bComputedEvent.parameters = new Array()

  bComputedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  bComputedEvent.parameters.push(
    new ethereum.EventParam("bValue", ethereum.Value.fromUnsignedBigInt(bValue))
  )
  bComputedEvent.parameters.push(
    new ethereum.EventParam(
      "coverageRatioNum",
      ethereum.Value.fromUnsignedBigInt(coverageRatioNum)
    )
  )
  bComputedEvent.parameters.push(
    new ethereum.EventParam(
      "coverageRatioDen",
      ethereum.Value.fromUnsignedBigInt(coverageRatioDen)
    )
  )

  return bComputedEvent
}

export function createBatchWinningsDistributedEvent(
  marketId: BigInt,
  totalDistributed: BigInt,
  recipientCount: BigInt
): BatchWinningsDistributed {
  let batchWinningsDistributedEvent =
    changetype<BatchWinningsDistributed>(newMockEvent())

  batchWinningsDistributedEvent.parameters = new Array()

  batchWinningsDistributedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  batchWinningsDistributedEvent.parameters.push(
    new ethereum.EventParam(
      "totalDistributed",
      ethereum.Value.fromUnsignedBigInt(totalDistributed)
    )
  )
  batchWinningsDistributedEvent.parameters.push(
    new ethereum.EventParam(
      "recipientCount",
      ethereum.Value.fromUnsignedBigInt(recipientCount)
    )
  )

  return batchWinningsDistributedEvent
}

export function createBettingTokenUpdatedEvent(
  oldToken: Address,
  newToken: Address,
  timestamp: BigInt
): BettingTokenUpdated {
  let bettingTokenUpdatedEvent = changetype<BettingTokenUpdated>(newMockEvent())

  bettingTokenUpdatedEvent.parameters = new Array()

  bettingTokenUpdatedEvent.parameters.push(
    new ethereum.EventParam("oldToken", ethereum.Value.fromAddress(oldToken))
  )
  bettingTokenUpdatedEvent.parameters.push(
    new ethereum.EventParam("newToken", ethereum.Value.fromAddress(newToken))
  )
  bettingTokenUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return bettingTokenUpdatedEvent
}

export function createClaimedEvent(
  marketId: BigInt,
  user: Address,
  amount: BigInt
): Claimed {
  let claimedEvent = changetype<Claimed>(newMockEvent())

  claimedEvent.parameters = new Array()

  claimedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  claimedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  claimedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return claimedEvent
}

export function createFeeAccruedEvent(
  marketId: BigInt,
  optionId: BigInt,
  isBuy: boolean,
  rawAmount: BigInt,
  fee: BigInt
): FeeAccrued {
  let feeAccruedEvent = changetype<FeeAccrued>(newMockEvent())

  feeAccruedEvent.parameters = new Array()

  feeAccruedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  feeAccruedEvent.parameters.push(
    new ethereum.EventParam(
      "optionId",
      ethereum.Value.fromUnsignedBigInt(optionId)
    )
  )
  feeAccruedEvent.parameters.push(
    new ethereum.EventParam("isBuy", ethereum.Value.fromBoolean(isBuy))
  )
  feeAccruedEvent.parameters.push(
    new ethereum.EventParam(
      "rawAmount",
      ethereum.Value.fromUnsignedBigInt(rawAmount)
    )
  )
  feeAccruedEvent.parameters.push(
    new ethereum.EventParam("fee", ethereum.Value.fromUnsignedBigInt(fee))
  )

  return feeAccruedEvent
}

export function createFeeCollectedEvent(
  marketId: BigInt,
  amount: BigInt
): FeeCollected {
  let feeCollectedEvent = changetype<FeeCollected>(newMockEvent())

  feeCollectedEvent.parameters = new Array()

  feeCollectedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  feeCollectedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return feeCollectedEvent
}

export function createFeeCollectorUpdatedEvent(
  oldCollector: Address,
  newCollector: Address
): FeeCollectorUpdated {
  let feeCollectorUpdatedEvent = changetype<FeeCollectorUpdated>(newMockEvent())

  feeCollectorUpdatedEvent.parameters = new Array()

  feeCollectorUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldCollector",
      ethereum.Value.fromAddress(oldCollector)
    )
  )
  feeCollectorUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newCollector",
      ethereum.Value.fromAddress(newCollector)
    )
  )

  return feeCollectorUpdatedEvent
}

export function createFeesUnlockedEvent(
  marketId: BigInt,
  amount: BigInt
): FeesUnlocked {
  let feesUnlockedEvent = changetype<FeesUnlocked>(newMockEvent())

  feesUnlockedEvent.parameters = new Array()

  feesUnlockedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  feesUnlockedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return feesUnlockedEvent
}

export function createFreeMarketConfigSetEvent(
  marketId: BigInt,
  maxFreeParticipants: BigInt,
  tokensPerParticipant: BigInt,
  totalPrizePool: BigInt
): FreeMarketConfigSet {
  let freeMarketConfigSetEvent = changetype<FreeMarketConfigSet>(newMockEvent())

  freeMarketConfigSetEvent.parameters = new Array()

  freeMarketConfigSetEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  freeMarketConfigSetEvent.parameters.push(
    new ethereum.EventParam(
      "maxFreeParticipants",
      ethereum.Value.fromUnsignedBigInt(maxFreeParticipants)
    )
  )
  freeMarketConfigSetEvent.parameters.push(
    new ethereum.EventParam(
      "tokensPerParticipant",
      ethereum.Value.fromUnsignedBigInt(tokensPerParticipant)
    )
  )
  freeMarketConfigSetEvent.parameters.push(
    new ethereum.EventParam(
      "totalPrizePool",
      ethereum.Value.fromUnsignedBigInt(totalPrizePool)
    )
  )

  return freeMarketConfigSetEvent
}

export function createFreeTokensClaimedEvent(
  marketId: BigInt,
  user: Address,
  tokens: BigInt
): FreeTokensClaimed {
  let freeTokensClaimedEvent = changetype<FreeTokensClaimed>(newMockEvent())

  freeTokensClaimedEvent.parameters = new Array()

  freeTokensClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  freeTokensClaimedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  freeTokensClaimedEvent.parameters.push(
    new ethereum.EventParam("tokens", ethereum.Value.fromUnsignedBigInt(tokens))
  )

  return freeTokensClaimedEvent
}

export function createLiquidityAddedEvent(
  marketId: BigInt,
  provider: Address,
  amount: BigInt
): LiquidityAdded {
  let liquidityAddedEvent = changetype<LiquidityAdded>(newMockEvent())

  liquidityAddedEvent.parameters = new Array()

  liquidityAddedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  liquidityAddedEvent.parameters.push(
    new ethereum.EventParam("provider", ethereum.Value.fromAddress(provider))
  )
  liquidityAddedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return liquidityAddedEvent
}

export function createMarketCreatedEvent(
  marketId: BigInt,
  question: string,
  options: Array<string>,
  endTime: BigInt,
  category: i32,
  marketType: i32,
  creator: Address
): MarketCreated {
  let marketCreatedEvent = changetype<MarketCreated>(newMockEvent())

  marketCreatedEvent.parameters = new Array()

  marketCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  marketCreatedEvent.parameters.push(
    new ethereum.EventParam("question", ethereum.Value.fromString(question))
  )
  marketCreatedEvent.parameters.push(
    new ethereum.EventParam("options", ethereum.Value.fromStringArray(options))
  )
  marketCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "endTime",
      ethereum.Value.fromUnsignedBigInt(endTime)
    )
  )
  marketCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "category",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(category))
    )
  )
  marketCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "marketType",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(marketType))
    )
  )
  marketCreatedEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )

  return marketCreatedEvent
}

export function createMarketDisputedEvent(
  marketId: BigInt,
  disputer: Address,
  reason: string
): MarketDisputed {
  let marketDisputedEvent = changetype<MarketDisputed>(newMockEvent())

  marketDisputedEvent.parameters = new Array()

  marketDisputedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  marketDisputedEvent.parameters.push(
    new ethereum.EventParam("disputer", ethereum.Value.fromAddress(disputer))
  )
  marketDisputedEvent.parameters.push(
    new ethereum.EventParam("reason", ethereum.Value.fromString(reason))
  )

  return marketDisputedEvent
}

export function createMarketInvalidatedEvent(
  marketId: BigInt,
  validator: Address,
  refundedAmount: BigInt
): MarketInvalidated {
  let marketInvalidatedEvent = changetype<MarketInvalidated>(newMockEvent())

  marketInvalidatedEvent.parameters = new Array()

  marketInvalidatedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  marketInvalidatedEvent.parameters.push(
    new ethereum.EventParam("validator", ethereum.Value.fromAddress(validator))
  )
  marketInvalidatedEvent.parameters.push(
    new ethereum.EventParam(
      "refundedAmount",
      ethereum.Value.fromUnsignedBigInt(refundedAmount)
    )
  )

  return marketInvalidatedEvent
}

export function createMarketPausedEvent(marketId: BigInt): MarketPaused {
  let marketPausedEvent = changetype<MarketPaused>(newMockEvent())

  marketPausedEvent.parameters = new Array()

  marketPausedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )

  return marketPausedEvent
}

export function createMarketResolvedEvent(
  marketId: BigInt,
  winningOptionId: BigInt,
  resolver: Address
): MarketResolved {
  let marketResolvedEvent = changetype<MarketResolved>(newMockEvent())

  marketResolvedEvent.parameters = new Array()

  marketResolvedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  marketResolvedEvent.parameters.push(
    new ethereum.EventParam(
      "winningOptionId",
      ethereum.Value.fromUnsignedBigInt(winningOptionId)
    )
  )
  marketResolvedEvent.parameters.push(
    new ethereum.EventParam("resolver", ethereum.Value.fromAddress(resolver))
  )

  return marketResolvedEvent
}

export function createMarketValidatedEvent(
  marketId: BigInt,
  validator: Address
): MarketValidated {
  let marketValidatedEvent = changetype<MarketValidated>(newMockEvent())

  marketValidatedEvent.parameters = new Array()

  marketValidatedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  marketValidatedEvent.parameters.push(
    new ethereum.EventParam("validator", ethereum.Value.fromAddress(validator))
  )

  return marketValidatedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPausedEvent(account: Address): Paused {
  let pausedEvent = changetype<Paused>(newMockEvent())

  pausedEvent.parameters = new Array()

  pausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return pausedEvent
}

export function createPlatformFeesWithdrawnEvent(
  collector: Address,
  amount: BigInt
): PlatformFeesWithdrawn {
  let platformFeesWithdrawnEvent =
    changetype<PlatformFeesWithdrawn>(newMockEvent())

  platformFeesWithdrawnEvent.parameters = new Array()

  platformFeesWithdrawnEvent.parameters.push(
    new ethereum.EventParam("collector", ethereum.Value.fromAddress(collector))
  )
  platformFeesWithdrawnEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return platformFeesWithdrawnEvent
}

export function createPricesUpdatedEvent(
  marketId: BigInt,
  prices: Array<BigInt>
): PricesUpdated {
  let pricesUpdatedEvent = changetype<PricesUpdated>(newMockEvent())

  pricesUpdatedEvent.parameters = new Array()

  pricesUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  pricesUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "prices",
      ethereum.Value.fromUnsignedBigIntArray(prices)
    )
  )

  return pricesUpdatedEvent
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return roleAdminChangedEvent
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleGrantedEvent
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleRevokedEvent
}

export function createSharesSoldEvent(
  marketId: BigInt,
  optionId: BigInt,
  seller: Address,
  quantity: BigInt,
  price: BigInt
): SharesSold {
  let sharesSoldEvent = changetype<SharesSold>(newMockEvent())

  sharesSoldEvent.parameters = new Array()

  sharesSoldEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  sharesSoldEvent.parameters.push(
    new ethereum.EventParam(
      "optionId",
      ethereum.Value.fromUnsignedBigInt(optionId)
    )
  )
  sharesSoldEvent.parameters.push(
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )
  sharesSoldEvent.parameters.push(
    new ethereum.EventParam(
      "quantity",
      ethereum.Value.fromUnsignedBigInt(quantity)
    )
  )
  sharesSoldEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )

  return sharesSoldEvent
}

export function createSlippageProtectEvent(
  marketId: BigInt,
  optionId: BigInt,
  isBuy: boolean,
  quantity: BigInt,
  bound: BigInt,
  actualTotal: BigInt
): SlippageProtect {
  let slippageProtectEvent = changetype<SlippageProtect>(newMockEvent())

  slippageProtectEvent.parameters = new Array()

  slippageProtectEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  slippageProtectEvent.parameters.push(
    new ethereum.EventParam(
      "optionId",
      ethereum.Value.fromUnsignedBigInt(optionId)
    )
  )
  slippageProtectEvent.parameters.push(
    new ethereum.EventParam("isBuy", ethereum.Value.fromBoolean(isBuy))
  )
  slippageProtectEvent.parameters.push(
    new ethereum.EventParam(
      "quantity",
      ethereum.Value.fromUnsignedBigInt(quantity)
    )
  )
  slippageProtectEvent.parameters.push(
    new ethereum.EventParam("bound", ethereum.Value.fromUnsignedBigInt(bound))
  )
  slippageProtectEvent.parameters.push(
    new ethereum.EventParam(
      "actualTotal",
      ethereum.Value.fromUnsignedBigInt(actualTotal)
    )
  )

  return slippageProtectEvent
}

export function createTradeExecutedEvent(
  marketId: BigInt,
  optionId: BigInt,
  buyer: Address,
  seller: Address,
  price: BigInt,
  quantity: BigInt,
  tradeId: BigInt
): TradeExecuted {
  let tradeExecutedEvent = changetype<TradeExecuted>(newMockEvent())

  tradeExecutedEvent.parameters = new Array()

  tradeExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  tradeExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "optionId",
      ethereum.Value.fromUnsignedBigInt(optionId)
    )
  )
  tradeExecutedEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  tradeExecutedEvent.parameters.push(
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )
  tradeExecutedEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )
  tradeExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "quantity",
      ethereum.Value.fromUnsignedBigInt(quantity)
    )
  )
  tradeExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "tradeId",
      ethereum.Value.fromUnsignedBigInt(tradeId)
    )
  )

  return tradeExecutedEvent
}

export function createUnpausedEvent(account: Address): Unpaused {
  let unpausedEvent = changetype<Unpaused>(newMockEvent())

  unpausedEvent.parameters = new Array()

  unpausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return unpausedEvent
}

export function createUserPortfolioUpdatedEvent(
  user: Address,
  totalInvested: BigInt,
  totalWinnings: BigInt,
  unrealizedPnL: BigInt,
  realizedPnL: BigInt,
  tradeCount: BigInt
): UserPortfolioUpdated {
  let userPortfolioUpdatedEvent =
    changetype<UserPortfolioUpdated>(newMockEvent())

  userPortfolioUpdatedEvent.parameters = new Array()

  userPortfolioUpdatedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  userPortfolioUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "totalInvested",
      ethereum.Value.fromUnsignedBigInt(totalInvested)
    )
  )
  userPortfolioUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "totalWinnings",
      ethereum.Value.fromUnsignedBigInt(totalWinnings)
    )
  )
  userPortfolioUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "unrealizedPnL",
      ethereum.Value.fromSignedBigInt(unrealizedPnL)
    )
  )
  userPortfolioUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "realizedPnL",
      ethereum.Value.fromSignedBigInt(realizedPnL)
    )
  )
  userPortfolioUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "tradeCount",
      ethereum.Value.fromUnsignedBigInt(tradeCount)
    )
  )

  return userPortfolioUpdatedEvent
}

export function createWinningsDistributedToUserEvent(
  marketId: BigInt,
  user: Address,
  amount: BigInt
): WinningsDistributedToUser {
  let winningsDistributedToUserEvent =
    changetype<WinningsDistributedToUser>(newMockEvent())

  winningsDistributedToUserEvent.parameters = new Array()

  winningsDistributedToUserEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  winningsDistributedToUserEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  winningsDistributedToUserEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return winningsDistributedToUserEvent
}
