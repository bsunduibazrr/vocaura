import { Request, Response, NextFunction } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { prisma } from "../db/prisma";

export interface AuthRequest extends Request {
  userId?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const clerkUserId = auth.userId;
  let user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });

  if (!user) {
    let email = "";
    try {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const primary = clerkUser.emailAddresses.find(
        (item) => item.id === clerkUser.primaryEmailAddressId,
      );
      email =
        primary?.emailAddress ||
        clerkUser.emailAddresses[0]?.emailAddress ||
        "";
    } catch (error) {
      email = "";
    }

    if (email) {
      const existingByEmail = await prisma.user.findUnique({ where: { email } });
      if (existingByEmail) {
        if (!existingByEmail.clerkId) {
          user = await prisma.user.update({
            where: { id: existingByEmail.id },
            data: { clerkId: clerkUserId }
          });
        } else {
          user = existingByEmail;
        }
      } else {
        user = await prisma.user.create({
          data: {
            email,
            passwordHash: "clerk",
            clerkId: clerkUserId
          }
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email: `clerk_${clerkUserId}@local`,
          passwordHash: "clerk",
          clerkId: clerkUserId
        }
      });
    }
  }

  req.userId = user.id;
  next();
}
