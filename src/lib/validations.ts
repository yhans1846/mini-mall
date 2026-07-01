import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少 6 位"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "用户名至少 2 个字符")
    .max(20, "用户名最多 20 个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少 6 位"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
