// prisma/download-images.js — 下载商品图片到本地并更新数据库
const https = require("https");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const OUTPUT_DIR = path.resolve(__dirname, "../public/uploads/products");

// 确保目录存在
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/** 下载单张图片 */
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, { timeout: 15000 }, (res) => {
        // picsum 可能跳转
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlinkSync(dest);
          return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          // 检查文件大小
          const stat = fs.statSync(dest);
          if (stat.size < 100) {
            fs.unlinkSync(dest);
            reject(new Error(`文件太小 (${stat.size}): ${url}`));
          } else {
            resolve();
          }
        });
      })
      .on("error", (err) => {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(err);
      });
  });
}

async function main() {
  const products = await prisma.product.findMany({
    where: { imageUrl: { not: "" } },
    orderBy: { id: "asc" },
  });

  console.log(`共 ${products.length} 个商品需要下载图片`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const ext = "jpg";
    const filename = `product_${p.id}.${ext}`;
    const dest = path.join(OUTPUT_DIR, filename);
    const localUrl = `/uploads/products/${filename}`;

    // 跳过已存在的
    if (fs.existsSync(dest)) {
      // 只更新 DB 路径
      if (p.imageUrl !== localUrl) {
        await prisma.product.update({
          where: { id: p.id },
          data: { imageUrl: localUrl },
        });
        process.stdout.write(`✓ ${p.id} ${p.name} (已存在, 更新路径)\n`);
      } else {
        process.stdout.write(`· ${p.id} ${p.name} (跳过)\n`);
      }
      success++;
      continue;
    }

    try {
      const url = p.imageUrl.startsWith("http") ? p.imageUrl : `https://picsum.photos/seed/product${p.id}/400/400`;
      process.stdout.write(`[${i + 1}/${products.length}] ${p.id} ${p.name}... `);
      await download(url, dest);
      await prisma.product.update({
        where: { id: p.id },
        data: { imageUrl: localUrl },
      });
      process.stdout.write(`✓\n`);
      success++;
    } catch (err) {
      process.stdout.write(`✗ ${err.message}\n`);
      failed++;
    }

    // 每 10 张暂停 500ms 避免被限
    if (i % 10 === 9) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\n完成: ${success} 成功, ${failed} 失败`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("脚本异常:", e);
  process.exit(1);
});
