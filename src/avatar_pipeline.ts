import { z } from "zod";
import { InfraiImageClient } from "./infrai_image_client.ts";

export const avatarRequestSchema = z.object({
  sellerId: z.string().min(1),
  buyerId: z.string().min(1),
  orderId: z.string().min(1),
  filename: z.string().min(1),
  file: z.string().min(1)
});

export type AvatarRequest = z.infer<typeof avatarRequestSchema>;
export type AvatarHandoff = {
  sellerId: string;
  buyerId: string;
  orderId: string;
  avatarImageId: string;
  state: "ready_for_order";
};

export async function prepareAvatar(input: unknown, client: InfraiImageClient): Promise<AvatarHandoff> {
  const request = avatarRequestSchema.parse(input);
  const uploaded = await client.upload(request.file, request.filename);
  const cropped = await client.smartCrop(uploaded.id, "1:1");
  return {
    sellerId: request.sellerId,
    buyerId: request.buyerId,
    orderId: request.orderId,
    avatarImageId: cropped.id,
    state: "ready_for_order"
  };
}

const sample: AvatarRequest = {
  sellerId: "seller-42",
  buyerId: "buyer-19",
  orderId: "order-8001",
  filename: "portrait.jpg",
  file: "data:image/jpeg;base64,ZXhhbXBsZQ=="
};

if (process.argv[1]?.endsWith("avatar_pipeline.ts")) {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before running the example");
  const result = await prepareAvatar(sample, new InfraiImageClient(key));
  console.log(JSON.stringify(result, null, 2));
}
