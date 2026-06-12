const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const dishName = process.argv[2];
const dataFile = process.argv[3];

if (!dishName || !dataFile) {
  console.error('用法: node generate-image.js <菜名> <data.json路径>');
  process.exit(1);
}

const IMAGE_API_KEY = 'a6dcd83e-ea45-4413-8a47-35e2d03eb56a';
const IMAGE_MODEL = 'doubao-seedream-5-0-260128';
const IMAGE_DIR = path.join(__dirname, 'public', 'images');

const prompt = `生成一张有食欲的菜品"${dishName}"图片，精美的摆盘，温暖的灯光，背景是干净的厨房或餐桌，食物看起来非常美味，专业美食摄影风格`;

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`下载图片失败: HTTP ${response.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(destPath);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    const ac = new AbortController();
    setTimeout(() => ac.abort(), 120000);

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${IMAGE_API_KEY}`
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt: prompt,
        sequential_image_generation: 'disabled',
        response_format: 'url',
        size: '2K',
        stream: false,
        watermark: false
      }),
      signal: ac.signal
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('图片API错误:', response.status, errText.substring(0, 300));
      process.exit(1);
    }

    const result = await response.json();
    if (result.data && result.data.length > 0) {
      const imageUrl = result.data[0].url;
      console.log('图片生成成功:', imageUrl);

      if (!fs.existsSync(IMAGE_DIR)) {
        fs.mkdirSync(IMAGE_DIR, { recursive: true });
      }

      const timestamp = Date.now();
      const safeName = dishName.replace(/[\/\\:*?"<>|]/g, '_');
      const ext = '.png';
      const filename = `${safeName}_${timestamp}${ext}`;
      const destPath = path.join(IMAGE_DIR, filename);

      await downloadImage(imageUrl, destPath);
      console.log('图片已下载到:', destPath);

      const localPath = `/images/${filename}`;

      const fileData = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      const recipe = fileData.recipes.find(r => r.name === dishName);
      if (recipe) {
        if (recipe.imageUrl && recipe.imageUrl.startsWith('/images/')) {
          const oldFile = path.join(__dirname, 'public', recipe.imageUrl);
          if (fs.existsSync(oldFile)) {
            fs.unlinkSync(oldFile);
            console.log('已删除旧图片:', oldFile);
          }
        }
        recipe.imageUrl = localPath;
        fs.writeFileSync(dataFile, JSON.stringify(fileData, null, 2), 'utf-8');
        console.log('图片本地路径已保存到', dishName);
      } else {
        console.log('未找到菜品:', dishName);
      }
    } else {
      console.error('图片生成返回为空');
      process.exit(1);
    }
  } catch (e) {
    console.error('错误:', e.message);
    process.exit(1);
  }
})();
