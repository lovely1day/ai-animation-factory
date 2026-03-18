import { Router } from "express";
import { generateImagePrompts } from "../controllers/image-prompts.controller";

const router: Router = Router();

// توليد برومبتات صور من السكربتات
router.post("/generate", generateImagePrompts);

export default router;
