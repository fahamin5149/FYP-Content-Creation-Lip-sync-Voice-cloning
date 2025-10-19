import express from "express";
import { getTestData } from "../controllers/testController.js";

const router = express.Router();

router.get("/", getTestData);

export default router;
