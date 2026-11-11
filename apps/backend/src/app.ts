
import express from "express";
import cors from "cors";
import projectRoutes from "./routes/projectRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Experiment Tracker API is running",
  });
});

app.use("/api/projects", projectRoutes);

export default app;
