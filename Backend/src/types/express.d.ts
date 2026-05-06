import { AuthContext, FirebaseUserLike } from "./middleware/auth.middleware";

declare global {
  namespace Express {
    interface Request {
      firebaseUser?: FirebaseUserLike;
      auth?: AuthContext;
    }
  }
}
