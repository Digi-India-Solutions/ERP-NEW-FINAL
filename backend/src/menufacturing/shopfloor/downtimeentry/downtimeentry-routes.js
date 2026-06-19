import { Router } from "express";
import {
  createDowntimeEntry,
  getAllDowntimeEntries,
  getDowntimeEntryById,
  updateDowntimeEntry,
  resolveDowntimeEntry,
  deleteDowntimeEntry,
} from "./downtimeentry-contoller.js";

const router = Router();

router.post("/create", createDowntimeEntry);
router.get("/", getAllDowntimeEntries);
router.get("/:id", getDowntimeEntryById);
router.put("/:id", updateDowntimeEntry);
router.patch("/:id/resolve", resolveDowntimeEntry);
router.delete("/:id", deleteDowntimeEntry);

export default router;
