import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import { AdminLiquidityWithdrawn } from "../generated/schema"
import { AdminLiquidityWithdrawn as AdminLiquidityWithdrawnEvent } from "../generated/PolicastMarketV3/PolicastMarketV3"
import { handleAdminLiquidityWithdrawn } from "../src/policast-market-v-3"
import { createAdminLiquidityWithdrawnEvent } from "./policast-market-v-3-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let marketId = BigInt.fromI32(234)
    let creator = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let amount = BigInt.fromI32(234)
    let newAdminLiquidityWithdrawnEvent = createAdminLiquidityWithdrawnEvent(
      marketId,
      creator,
      amount
    )
    handleAdminLiquidityWithdrawn(newAdminLiquidityWithdrawnEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("AdminLiquidityWithdrawn created and stored", () => {
    assert.entityCount("AdminLiquidityWithdrawn", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AdminLiquidityWithdrawn",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "marketId",
      "234"
    )
    assert.fieldEquals(
      "AdminLiquidityWithdrawn",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "creator",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "AdminLiquidityWithdrawn",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
