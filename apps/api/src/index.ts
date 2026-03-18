import express, { Router } from "express";

import workflowRoutes from "./routes/workflow.routes";
import universeRoutes from "./routes/universe.routes";
import ollamaRoutes from "./routes/ollama.routes";

const router: Router = express.Router();

router.use("/workflow", workflowRoutes);
router.use("/universe", universeRoutes);
router.use("/ollama", ollamaRoutes);

export default router;