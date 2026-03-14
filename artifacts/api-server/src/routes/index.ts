import { Router, type IRouter } from "express";
import healthRouter from "./health";
import postsRouter from "./posts";
import commentsRouter from "./comments";
import postCommentsRouter from "./postComments";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/posts", postsRouter);
router.use("/posts/:id/comments", postCommentsRouter);
router.use("/comments", commentsRouter);
router.use("/profile", profileRouter);

export default router;
