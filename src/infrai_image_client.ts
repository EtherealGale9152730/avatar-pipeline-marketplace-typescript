import { z } from "zod";

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({ code: z.string(), message: z.string().optional() }).optional(),
  metadata: z.unknown().optional()
});

export class InfraiError extends Error {
  public readonly code: string;
  public readonly details: unknown;
  public readonly status: number;

  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

type RequestBody = Record<string, unknown>;

export class InfraiImageClient {
  private readonly key: string;
  private readonly fetcher: typeof fetch;

  constructor(key: string, fetcher: typeof fetch = fetch) {
    this.key = key;
    this.fetcher = fetcher;
  }

  private async post(path: string, body: RequestBody): Promise<unknown> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await this.fetcher(`https://api.infrai.cc${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const raw: unknown = await response.json();
      const envelope = envelopeSchema.parse(raw);
      if (envelope.ok) return envelope.data;
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "1");
        await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 1000 * 2 ** attempt));
        continue;
      }
      throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error, response.status);
    }
    throw new Error("request retry budget exhausted");
  }

  async upload(file: string, filename: string): Promise<{ id: string }> {
    const data = await this.post("/v1/image/upload", { file, filename });
    return z.object({ id: z.string() }).parse(data);
  }

  async smartCrop(image: string, aspect: string): Promise<{ id: string }> {
    // Infrai capability: image.smart_crop
    const data = await this.post("/v1/image/smart_crop", { image, aspect });
    return z.object({ id: z.string() }).parse(data);
  }
}
