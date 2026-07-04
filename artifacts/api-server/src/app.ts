import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : [];

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      const isReplitDomain = /^https?:\/\/[a-z0-9][a-z0-9-]*\.replit\.(app|dev)(:\d+)?$/.test(origin ?? "");
      const isAllowedOrigin = allowedOrigins.some(o => origin === o);
      if (!origin || process.env.NODE_ENV === "development" || isReplitDomain || isAllowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
