// @ts-check
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始填充种子数据...");

  // ===== 创建分类 =====
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "服装", slug: "clothing" },
    }),
    prisma.category.create({
      data: { name: "电子产品", slug: "electronics" },
    }),
    prisma.category.create({
      data: { name: "家居用品", slug: "home" },
    }),
    prisma.category.create({
      data: { name: "食品饮料", slug: "food" },
    }),
    prisma.category.create({
      data: { name: "图书", slug: "books" },
    }),
    prisma.category.create({
      data: { name: "运动户外", slug: "sports" },
    }),
  ]);
  console.log(`✅ 已创建 ${categories.length} 个分类`);

  // ===== 创建商品 =====
  const productsData = [
    // 服装 (clothing)
    { name: "经典纯棉T恤", description: "100% 纯棉面料，舒适透气，经典百搭款式", price: 99, stock: 200, imageUrl: "/images/products/t-shirt.jpg", categorySlug: "clothing" },
    { name: "修身牛仔裤", description: "弹力牛仔面料，修身剪裁，日常百搭", price: 259, stock: 150, imageUrl: "/images/products/jeans.jpg", categorySlug: "clothing" },
    { name: "轻薄羽绒服", description: "90% 白鹅绒填充，防风防泼水，轻便保暖", price: 599, stock: 80, imageUrl: "/images/products/down-jacket.jpg", categorySlug: "clothing" },
    // 电子产品 (electronics)
    { name: "无线蓝牙耳机", description: "主动降噪，30小时续航，IPX5防水", price: 399, stock: 300, imageUrl: "/images/products/earphones.jpg", categorySlug: "electronics" },
    { name: "智能手表 Pro", description: "1.5英寸AMOLED屏幕，心率血氧监测，GPS运动追踪", price: 1299, stock: 100, imageUrl: "/images/products/watch.jpg", categorySlug: "electronics" },
    { name: "便携充电宝 20000mAh", description: "双向快充，支持PD/QC协议，可上飞机", price: 149, stock: 500, imageUrl: "/images/products/powerbank.jpg", categorySlug: "electronics" },
    { name: "机械键盘 87键", description: "青轴机械开关，RGB背光，铝合金面板", price: 299, stock: 200, imageUrl: "/images/products/keyboard.jpg", categorySlug: "electronics" },
    // 家居用品 (home)
    { name: "记忆棉护颈枕", description: "慢回弹记忆棉，人体工学曲线，透气枕套可拆卸", price: 129, stock: 300, imageUrl: "/images/products/pillow.jpg", categorySlug: "home" },
    { name: "北欧风台灯", description: "三档调光，LED护眼，简约设计", price: 89, stock: 250, imageUrl: "/images/products/lamp.jpg", categorySlug: "home" },
    { name: "真空保温杯 500ml", description: "316不锈钢内胆，12小时保温，食品级硅胶密封", price: 79, stock: 400, imageUrl: "/images/products/mug.jpg", categorySlug: "home" },
    // 食品饮料 (food)
    { name: "云南精品咖啡豆 250g", description: "阿拉比卡单品，中深烘焙，口感醇厚", price: 68, stock: 500, imageUrl: "/images/products/coffee.jpg", categorySlug: "food" },
    { name: "混合坚果礼盒 1kg", description: "腰果杏仁核桃混合装，每日坚果，独立包装", price: 128, stock: 200, imageUrl: "/images/products/nuts.jpg", categorySlug: "food" },
    // 图书 (books)
    { name: "《深入理解计算机系统》", description: "计算机科学经典教材，从程序员视角理解计算机系统", price: 79, stock: 300, imageUrl: "/images/products/csapp.jpg", categorySlug: "books" },
    { name: "《设计模式：可复用面向对象软件的基础》", description: "GoF 经典设计模式，软件工程师必读", price: 45, stock: 400, imageUrl: "/images/products/design-patterns.jpg", categorySlug: "books" },
    // 运动户外 (sports)
    { name: "瑜伽垫 6mm", description: "TPE环保材质，双面防滑，附带收纳绑带", price: 69, stock: 350, imageUrl: "/images/products/yoga-mat.jpg", categorySlug: "sports" },
    { name: "专业跑步鞋", description: "缓震回弹中底，透气飞织鞋面，防滑橡胶大底", price: 369, stock: 120, imageUrl: "/images/products/running-shoes.jpg", categorySlug: "sports" },
  ];

  const products = await Promise.all(
    productsData.map((p) =>
      prisma.product.create({
        data: {
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          imageUrl: p.imageUrl,
          isPublished: true,
          category: { connect: { slug: p.categorySlug } },
        },
      })
    )
  );
  console.log(`✅ 已创建 ${products.length} 件商品`);

  // ===== 创建用户 =====
  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "管理员",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  const userPasswordHash = await bcrypt.hash("user123", 10);

  const normalUser = await prisma.user.create({
    data: {
      email: "user@example.com",
      name: "张三",
      password: userPasswordHash,
      role: "USER",
      membershipLevel: 0,
      totalSpent: 0,
    },
  });

  const vip1User = await prisma.user.create({
    data: {
      email: "vip1@example.com",
      name: "李四（心悦1级）",
      password: userPasswordHash,
      role: "USER",
      membershipLevel: 1,
      totalSpent: 8000,
    },
  });

  const vip2User = await prisma.user.create({
    data: {
      email: "vip2@example.com",
      name: "王五（心悦2级）",
      password: userPasswordHash,
      role: "USER",
      membershipLevel: 2,
      totalSpent: 80000,
    },
  });

  const vip3User = await prisma.user.create({
    data: {
      email: "vip3@example.com",
      name: "赵六（心悦3级）",
      password: userPasswordHash,
      role: "USER",
      membershipLevel: 3,
      totalSpent: 800000,
    },
  });

  console.log("✅ 已创建 5 个用户（1 管理员 + 4 会员等级测试用户）");

  // ===== 创建购物车数据（普通用户添加 2 件商品） =====
  await prisma.cartItem.create({
    data: {
      userId: normalUser.id,
      productId: products[0].id, // 经典纯棉T恤
      quantity: 2,
    },
  });
  await prisma.cartItem.create({
    data: {
      userId: normalUser.id,
      productId: products[3].id, // 无线蓝牙耳机
      quantity: 1,
    },
  });
  console.log("✅ 已创建购物车测试数据");

  // ===== 创建订单数据（为各等级用户创建历史订单） =====
  // 普通用户 - 1个已完成订单
  await createOrder(normalUser.id, [
    { productId: products[0].id, quantity: 1, price: 99 },
    { productId: products[3].id, quantity: 1, price: 399 },
  ], "COMPLETED", 1.0, 498, "北京市朝阳区xxx街道1号", "13800000001");

  // 心悦1级用户 - 1个已支付订单（已计入 totalSpent）
  await createOrder(vip1User.id, [
    { productId: products[4].id, quantity: 1, price: 1299 },
    { productId: products[8].id, quantity: 2, price: 89 },
  ], "PAID", 0.98, 1447.46, "北京市海淀区xxx街道2号", "13800000002");

  // 心悦2级用户 - 2个订单
  await createOrder(vip2User.id, [
    { productId: products[2].id, quantity: 1, price: 599 },
    { productId: products[6].id, quantity: 1, price: 299 },
  ], "COMPLETED", 0.95, 853.10, "上海市浦东新区xxx路3号", "13800000003");

  await createOrder(vip2User.id, [
    { productId: products[1].id, quantity: 2, price: 259 },
  ], "SHIPPED", 0.95, 492.10, "上海市浦东新区xxx路3号", "13800000003");

  // 心悦3级用户 - 1个订单
  await createOrder(vip3User.id, [
    { productId: products[5].id, quantity: 10, price: 149 },
    { productId: products[12].id, quantity: 5, price: 79 },
  ], "COMPLETED", 0.90, 1696.50, "广东省深圳市南山区xxx路4号", "13800000004");

  console.log("✅ 已创建订单测试数据");
  console.log("🎉 种子数据填充完毕！");
}

async function createOrder(userId, items, status, discountRate, totalAmount, address, phone) {
  const originalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await prisma.order.create({
    data: {
      userId,
      status,
      originalAmount,
      discountRate,
      totalAmount,
      address,
      phone,
      note: "",
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
  });

  return order;
}

main()
  .catch((e) => {
    console.error("❌ 种子数据填充失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
