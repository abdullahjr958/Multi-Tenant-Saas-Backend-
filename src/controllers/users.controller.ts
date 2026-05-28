import { Request, Response, NextFunction } from "express";
import {
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} from "../service/users.service";
import { GetUsersQuery } from "../validators/users.validator";

const getUsersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.user!;
    const { data, meta } = await getUsers(tenantId, req.parsedQuery as GetUsersQuery);
    return res.status(200).json({ data, meta });
  } catch (error) {
    next(error);
  }
};

const getUserByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, tenantId } = req.user!;
    const { id } = req.params;
    if(!id || typeof id !== "string") throw new Error("id params not found");
    
    const user = await getUserById(id, tenantId);
    return res.status(200).json(user);
  } catch (error) {
    next(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateUserRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, tenantId } = req.user!;
    const { role } = req.body;
    const { id } = req.params;

    if(!role) throw new Error("Role not found");
    if(!id || typeof id !== "string") throw new Error("id params not found");

    const updatedUser = await updateUserRole(id, userId, tenantId, role);
    return res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

const deleteUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, tenantId } = req.user!;
    const { id } = req.params;
    if(!id || typeof id !== "string") throw new Error("id params not found");

    await deleteUser(id, userId, tenantId);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  getUsersController,
  getUserByIdController,
  updateUserRoleController,
  deleteUserController,
};
