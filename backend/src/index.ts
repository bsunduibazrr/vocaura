import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import wordsRouter from "./routes/words";
import quizRouter from "./routes/quiz";
import statsRouter from "./routes/stats";
import autoRouter from "./routes/auto";
import reviewRouter from "./routes/review";
import progressRouter from "./routes/progress";
import achievementsRouter from "./routes/achievements";
import masteryRouter from "./routes/mastery";
import heatmapRouter from "./routes/heatmap";
import packsRouter from "./routes/packs";
import authRouter from "./routes/auth";
import { startSchedulers } from "./services/schedulerService";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/words", wordsRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/stats", statsRouter);
app.use("/api/auto", autoRouter);
app.use("/api/review", reviewRouter);
app.use("/api/progress", progressRouter);
app.use("/api/achievements", achievementsRouter);
app.use("/api/words/mastery", masteryRouter);
app.use("/api/stats/heatmap", heatmapRouter);
app.use("/api/packs", packsRouter);
app.use("/api/auth", authRouter);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(400).json({ error: message });
  },
);

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  startSchedulers(process.env.TIMEZONE || "Asia/Ulaanbaatar");
  // eslint-disable-next-line no-console
  console.log(`Backend running on port ${PORT}`);
});
