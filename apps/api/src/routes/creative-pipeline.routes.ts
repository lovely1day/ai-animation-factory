import { Router } from "express";
import {
  runStoryArchitect,
  runScreenplayWriter,
  runVisualDirector,
  runExecutiveReview,
  runFullPipeline,
  getCreativeProviders,
} from "../controllers/creative-pipeline.controller";

const router: Router = Router();

// Individual stages
router.post("/stage/story",      runStoryArchitect);
router.post("/stage/screenplay", runScreenplayWriter);
router.post("/stage/visuals",    runVisualDirector);
router.post("/stage/review",     runExecutiveReview);

// Full pipeline (all 4 stages sequentially)
router.post("/full-pipeline",    runFullPipeline);

// Status
router.get("/providers",         getCreativeProviders);

export default router;
