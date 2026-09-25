import { describe, expect, it } from "vitest";

import { OrderStatus } from "@/generated/prisma/enums";

import {
  allowedTransitions,
  canTransition,
  formatOrderNumber,
  ORDER_NUMBER_PATTERN,
  orderStatusLabels,
  restocksOn,
} from "./status";

describe("order status transitions", () => {
  it("moves forward through fulfilment", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "PROCESSING")).toBe(true);
    expect(canTransition("PROCESSING", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("never goes backwards or leaves a final state", () => {
    expect(canTransition("SHIPPED", "PENDING")).toBe(false);
    expect(canTransition("SHIPPED", "CANCELLED")).toBe(false);
    expect(allowedTransitions("CANCELLED")).toEqual([]);
    expect(allowedTransitions("REFUNDED")).toEqual([]);
  });

  it("restocks only when cancelling before shipment", () => {
    expect(restocksOn("PENDING", "CANCELLED")).toBe(true);
    expect(restocksOn("PROCESSING", "CANCELLED")).toBe(true);
    expect(restocksOn("DELIVERED", "REFUNDED")).toBe(false);
  });

  it("labels every status in Romanian", () => {
    for (const status of Object.values(OrderStatus)) expect(orderStatusLabels[status]).toBeTruthy();
  });
});

describe("order numbers", () => {
  it("formats a per-year sequence", () => {
    expect(formatOrderNumber(2026, 123)).toBe("AR-2026-000123");
    expect(formatOrderNumber(2027, 1234567)).toBe("AR-2027-1234567");
    expect(ORDER_NUMBER_PATTERN.test("AR-2026-000123")).toBe(true);
    expect(ORDER_NUMBER_PATTERN.test("../etc")).toBe(false);
  });
});
