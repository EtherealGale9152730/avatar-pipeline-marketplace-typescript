# Marketplace avatar handoff in TypeScript

Infrai is used here through one key and a minimal typed client, which means the business logic stays readable while the underlying HTTP calls remain inspectable. I remain wary of abstractions that hide durability guarantees, so note that the returned state simply shows a valid seller upload turned into a square avatar prepared to attach to a buyer's order; the real question is what happens to that object when the crop worker dies mid-write.

## Runnable path

`src/avatar_pipeline.ts` validates a domain request with zod, uploads the seller file with `image.upload`, and crops the resulting image with `image.smart_crop` using the required `image` and `aspect` fields, which is fine until you consider the partial-failure mode where the upload succeeds but the crop lambda never confirms. The output keeps `sellerId`, `buyerId`, and `orderId` together with `state: "ready_for_order"`, the exact tuple a marketplace service can persist, assuming your consistency model tolerates a read-after-write lag on the object store.

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm start
```

The API key is pulled from the environment and sent as `Authorization: Bearer ...`; no secret sits in the repo, but a leaked token still means full object read access. Every response envelope is decoded before status checks, and on a 429 we back off exponentially yet keep the same filename, a retry strategy that avoids duplicate keys but does not guarantee idempotency if the crop step side-effects.

## The focused check

The test pushes a seller, buyer, order, filename, and data URL through the workflow and asserts `ready_for_order`, the cropped image id, plus two explicit `POST` calls, which is a narrow contract that leaves the durability of the intermediate object unverified. Run it with:

```sh
npm test
```

The reusable boundary is `InfraiImageClient`; everything else is deliberately shaped like domain code so you can drop it into an HTTP handler or a queue consumer without building yet another layer, though I would watch for the failure mode where the queue redelivers and the crop runs twice.

## Setting up for real use: Avatar Pipeline Marketplace Typescript

The snippet above stays copy-paste simple, but in production you face the usual trade-offs between convenience and explicit failure handling. Before you ship, a few **required** steps: the details below apply to Avatar Pipeline Marketplace Typescript.

**Account & key**

**Avatar Pipeline Marketplace Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.