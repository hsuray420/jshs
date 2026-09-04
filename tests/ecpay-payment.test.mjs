import test from "node:test";
import assert from "node:assert/strict";

const { buildEcpayPaymentParams, buildEcpayCheckMacValue } = await import("../lib/ecpay.ts");

test("ECPay payment params carry the selected integer amount", () => {
  const params = buildEcpayPaymentParams({
    amount: 500,
    merchantId: "3002607",
    returnUrl: "https://jshs.cc/api/donation/notify",
    clientBackUrl: "https://jshs.cc/support",
    now: new Date("2026-09-04T04:30:00.000Z"),
    tradeNo: "JSHS202609040001",
  });

  assert.equal(params.TotalAmount, 500);
  assert.equal(params.PaymentType, "aio");
  assert.equal(params.EncryptType, 1);
  assert.equal(params.MerchantTradeNo, "JSHS202609040001");
});

test("ECPay CheckMacValue is generated from the signed fields", async () => {
  const params = {
    MerchantID: "3002607",
    MerchantTradeNo: "JSHS202609040001",
    MerchantTradeDate: "2026/09/04 12:30:00",
    PaymentType: "aio",
    TotalAmount: 500,
    TradeDesc: "支持 JSHS",
    ItemName: "JSHS 支持款",
    ReturnURL: "https://jshs.cc/api/donation/notify",
    ChoosePayment: "ALL",
    EncryptType: 1,
  };

  const checkMacValue = await buildEcpayCheckMacValue(params, "pwFHCqoQZGmho4w6", "EkRm7iFT261dpevs");
  assert.match(checkMacValue, /^[A-F0-9]{64}$/);
});
