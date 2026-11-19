import { Request, Response } from "express";
import { z } from "zod";
import { createPerson, getAllPersons, updatePerson } from "../services/persons.service.js";
import { parseId } from "../utils/httpErorr.js";
import { imageUrlSchema } from "../utils/imageUrl.js";

export const createPersonBody = z.object({
  name: z.string().trim().min(1, "Namn krävs.").max(200),
  photo_url: imageUrlSchema.optional().nullable(),
  bio: z.string().trim().max(10000).optional().nullable(),
  tmdb_id: z.number().int().positive().max(2147483647).optional().nullable(),
});

export const updatePersonBody = createPersonBody.partial();

export const castMemberBody = updatePersonBody.extend({
  person_id: z.number().int().positive().max(2147483647).optional(),
  character_name: z.string().trim().max(300).optional().nullable(),
  billing_order: z.number().int().min(0).max(2147483647).optional(),
}).refine((member) => member.person_id !== undefined || member.name !== undefined, {
  message: "Ange person_id eller namn för skådespelaren.",
});

const listPersonsQuery = z.object({ search: z.string().trim().max(200).optional() });

export async function getPersons(req: Request, res: Response) {
  const { search } = listPersonsQuery.parse(req.query);
  res.json({ success: true, data: await getAllPersons(search) });
}

export async function postPerson(req: Request, res: Response) {
  const person = await createPerson(createPersonBody.parse(req.body));
  res.status(201).json({ success: true, data: person });
}

export async function putPerson(req: Request, res: Response) {
  const id = parseId(req.params.id, "person-ID");
  const person = await updatePerson(id, updatePersonBody.parse(req.body));
  res.json({ success: true, data: person });
}
