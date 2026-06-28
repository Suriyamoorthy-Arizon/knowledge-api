import { Router } from "express";

import {
  getAllArticles,
  getArticleById,
  createArticle,
  deleteArticle,
} from "../controllers/articleController.js";

const router = Router();

router.get("/", getAllArticles);
router.get("/:id", getArticleById);
router.post("/", createArticle);
router.delete("/:id", deleteArticle);

export default router;
