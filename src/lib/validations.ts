import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "用户名至少 2 个字符")
    .max(20, "用户名最多 20 个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  // bcryptjs 最大输入 72 字节，超出部分静默截断
  password: z.string().min(6, "密码至少 6 位").max(72, "密码最多 72 位"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
