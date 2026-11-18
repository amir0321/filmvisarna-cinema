import { Router } from "express";
import { getPersons, postPerson, putPerson } from "../controllers/persons.controller.js";
import { requireAdmin } from "../middleware/auth.js";

export const personsRouter = Router();

personsRouter.get("/", getPersons);
personsRouter.post("/", requireAdmin, postPerson);
personsRouter.put("/:id", requireAdmin, putPerson);
