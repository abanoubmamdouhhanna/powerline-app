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
  isValid(headersSchema, true),
  auth(["employee"]),
  isValid(searchContactsSchema),
  contactController.searchContacts
);

//get all contacts
router.get(
  "/getAllContacts",
  isValid(headersSchema, true),
  auth(["employee"]),
  contactController.getAllContacts
);

//get dm list unified
router.get(
  "/getDMListUnified",
  isValid(headersSchema, true),
  auth(["employee"]),
  contactController.getDMListUnified
);
export default router;
