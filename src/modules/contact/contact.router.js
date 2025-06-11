import Router from "express";
import * as contactController from "./controller/contact.controller.js";
import {
  headersSchema,
  searchContactsSchema,
} from "./controller/contact.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

//search contacts
router.post(
  "/searchContacts",
  auth(["admin", "employee", "assistant"]),
  isValid(searchContactsSchema),
  contactController.searchContacts
);

//get all contacts
router.get(
  "/getAllContacts",
  auth(["admin", "employee", "assistant"]),
  contactController.getAllContacts
);

//get dm list unified
router.get(
  "/getDMListUnified",
  auth(["admin", "employee", "assistant"]),
  contactController.getDMListUnified
);
export default router;
