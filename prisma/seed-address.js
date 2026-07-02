// 单独插入收货地址测试数据（种子已存在时使用）
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ orderBy: { id: "asc" } });

  const addressData = [
    { userId: users[1].id, name: "张三", phone: "13800000001", province: "北京市", city: "北京市", district: "朝阳区", detail: "建国路88号XX大厦12层", isDefault: true },
    { userId: users[2].id, name: "李四", phone: "13800000002", province: "北京市", city: "北京市", district: "海淀区", detail: "中关村大街1号XX科技园", isDefault: true },
    { userId: users[2].id, name: "李四公司", phone: "13800000002", province: "北京市", city: "北京市", district: "朝阳区", detail: "望京SOHO T3 15层", isDefault: false },
    { userId: users[3].id, name: "王五", phone: "13800000003", province: "上海市", city: "上海市", district: "浦东新区", detail: "陆家嘴金融中心20层", isDefault: true },
    { userId: users[4].id, name: "赵六", phone: "13800000004", province: "广东省", city: "深圳市", district: "南山区", detail: "科技园南区XX大厦", isDefault: true },
  ];

  for (const a of addressData) {
    try {
      await prisma.address.create({ data: a });
      console.log(`  + 地址: ${a.name} ${a.province}${a.city}`);
    } catch (e) {
      if (e.code === "P2002") console.log(`  ~ 已存在: ${a.name}`);
      else throw e;
    }
  }
  console.log("✅ 收货地址添加完成");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
