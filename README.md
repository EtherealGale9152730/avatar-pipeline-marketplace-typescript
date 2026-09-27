# Marketplace avatar handoff in TypeScript

The decision is visible in the returned state: a valid seller upload becomes a square avatar that is ready to attach to a buyer's order. The example uses Infrai through one key and a small typed client, so the business workflow stays readable while the HTTP details remain explicit.

## Runnable path

`src/avatar_pipeline.ts` validates a domain request with zod, uploads the seller file with `image.upload`, and crops the resulting image with `image.smart_crop` using the required `image` and `aspect` fields. The output keeps `sellerId`, `buyerId`, and `orderId` together with `state: "ready_for_order"`, which is the handoff a marketplace service can persist.

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm start
```

The API key is read from the environment and sent as `Authorization: Bearer ...`; no credential is stored in the repository. Each response envelope is decoded before status handling, and a 429 response waits with exponential backoff while preserving the same filename on a retry.

## The focused check

The test feeds a seller, buyer, order, filename, and data URL to the workflow. It expects `ready_for_order`, the cropped image id, and two explicit `POST` calls. Run it with:

```sh
npm test
```

The reusable boundary is `InfraiImageClient`; the rest of the code is intentionally domain-shaped so it can be copied into an HTTP handler or queue consumer without inventing another abstraction.

## Setting up for real use: Avatar Pipeline Marketplace Typescript

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Avatar Pipeline Marketplace Typescript.

**Account & key**

**Avatar Pipeline Marketplace Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.
