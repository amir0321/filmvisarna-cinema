import { Router, Request, Response } from "express";
import { z } from "zod";

export const contactRouter = Router();

const contactSchema = z.object({
  name: z.string().trim().min(1, "Namn krävs").max(100),
  email: z.string().trim().email("Ogiltig e-postadress").max(200),
  message: z.string().trim().min(1, "Meddelande krävs").max(2000),
});

contactRouter.post("/", async (req: Request, res: Response) => {
  const body = contactSchema.parse(req.body);

  // In production, this can send an email to cinema support or store in a table
  console.log("Contact form message received from:", body.email, body.name);

  res.status(200).json({
    success: true,
    message: "Tack för ditt meddelande! Vi återkommer så snart vi kan.",
  });
});
