import { ApiContext } from "./api-types";
import type { PassportStatic } from "passport";

export function registerAuthApi({ app }: ApiContext, passport: PassportStatic) {
  app.post("/api/auth", passport.authenticate("json"), (req, res) => {
    res.json({
      message: "Logged in successfully",
      user: req.user,
    });
  });

  app.get("/api/auth", (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return res.json({ user: req.user });
    }
    return res.json({ user: null });
  });

  app.delete("/api/auth", (req, res, next) => {
    (req as any).logout((err: any) => {
      if (err) return next(err);
      res.json({ message: "Logged out" });
    });
  });
}
