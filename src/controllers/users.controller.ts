import { Request, Response } from "express";
import {
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} from "../service/users.service";

const getUsersController = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const users = await getUsers(tenantId);
    return res.status(200).json(users);
  } catch (error) {
    if (error instanceof Error)
      return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getUserByIdController = async (req: Request, res: Response) => {
  try {
    const { userId, tenantId } = req.user!;
    const { id } = req.params;
    if(!id || typeof id !== "string") throw new Error("id params not found");
    
    const user = await getUserById(id, tenantId);
    return res.status(200).json(user);
  } catch (error) {
    if (error instanceof Error)
      return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateUserRoleController = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const { role } = req.body;
    const { id } = req.params;

    if(!role) throw new Error("Role not found");
    if(!id || typeof id !== "string") throw new Error("id params not found");

    const updatedUser = await updateUserRole(id, tenantId, role);
    return res.status(200).json(updatedUser);
  } catch (error) {
    if (error instanceof Error)
      return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: "Internal server error" });
  }
};

const deleteUserController = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const { id } = req.params;
    if(!id || typeof id !== "string") throw new Error("id params not found");

    await deleteUser(id, tenantId);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    if (error instanceof Error)
      return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: "Internal server error" });
  }
};

export {
  getUsersController,
  getUserByIdController,
  updateUserRoleController,
  deleteUserController,
};
