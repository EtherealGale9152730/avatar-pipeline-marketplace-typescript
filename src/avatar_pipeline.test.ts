import assert from "node:assert/strict";
import { InfraiImageClient } from "./infrai_image_client.ts";
import { prepareAvatar } from "./avatar_pipeline.ts";

const calls: string[] = [];
const fakeFetch: typeof fetch = async (url, init) => {
  calls.push(`${init?.method} ${url}`);
  const body = JSON.parse(String(init?.body));
  const id = body.image ? "cropped-avatar-7" : "uploaded-avatar-7";
  return new Response(JSON.stringify({ ok: true, data: { id }, metadata: {} }), { status: 200 });
};

const result = await prepareAvatar({
  sellerId: "seller-42", buyerId: "buyer-19", orderId: "order-8001",
  filename: "portrait.jpg", file: "data:image/jpeg;base64,ZXhhbXBsZQ=="
}, new InfraiImageClient("test-key", fakeFetch));

assert.equal(result.state, "ready_for_order");
assert.equal(result.avatarImageId, "cropped-avatar-7");
assert.deepEqual(calls.map((call) => call.split(" ")[0]), ["POST", "POST"]);
console.log("avatar decision test passed");
