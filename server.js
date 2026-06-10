const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.VOLC_API_KEY;
const BASE_URL = process.env.VOLC_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const MODEL = process.env.VOLC_MODEL;

const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use(express.static('build'));

const readData = () => {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
  return {
    recipes: [],
    blacklistedIds: [],
    config: { adults: 2, children: 0 },
    weekMenu: []
  };
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

const generateRecipeWithAI = async (dishName) => {
  if (!API_KEY) {
    throw new Error('未配置火山引擎 API Key');
  }

  const prompt = `你是一个专业的菜谱生成器。请为"${dishName}"生成一个完整的菜谱，格式必须是严格的JSON，不要包含任何其他文字。

JSON 格式要求：
{
  "name": "菜谱名称",
  "type": "分类（只能是这四个之一：荤菜、小荤、蔬菜、汤）",
  "ingredients": ["原料1", "原料2", ...],
  "steps": ["步骤1", "步骤2", ...],
  "time": "烹饪时间（如：30分钟）",
  "calories": 热量数值（整数）,
  "difficulty": "难度（简单、中等、困难）"
}

注意：
- type 必须准确分类：有大量肉类的是荤菜，蛋类/少量肉类是小荤，纯素菜是蔬菜，汤类是汤
- ingredients 要具体，比如"猪肉丝 200g"而不是"猪肉适量"，不需要体现盐、油、葱姜蒜这类调味料，只需要主要原料
- steps 要详细，分步骤说明
- calories 是估算的热量值，整数
`;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('AI 返回格式错误');
};

app.get('/api/data', (req, res) => {
  const data = readData();
  res.json(data);
});

app.post('/api/data', (req, res) => {
  const { recipes, blacklistedIds, config, weekMenu } = req.body;
  const data = {
    recipes,
    blacklistedIds,
    config,
    weekMenu,
    updatedAt: new Date().toISOString()
  };
  writeData(data);
  res.json({ success: true });
});

app.post('/api/generate-recipe', async (req, res) => {
  try {
    const { dishName } = req.body;
    if (!dishName) {
      return res.status(400).json({ success: false, error: '请提供菜品名称' });
    }

    const recipe = await generateRecipeWithAI(dishName);
    res.json({ success: true, data: recipe });
  } catch (error) {
    console.error('生成菜谱失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ai/generate', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: '请提供菜名' });
    }

    const recipe = await generateRecipeWithAI(name);
    res.json({ recipe });
  } catch (error) {
    console.error('AI生成失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/batch-import', async (req, res) => {
  try {
    const { dishNames } = req.body;
    if (!dishNames || !Array.isArray(dishNames)) {
      return res.status(400).json({ success: false, error: '请提供菜品名称数组' });
    }

    const validNames = dishNames.filter(name => name.trim());
    
    if (validNames.length === 0) {
      return res.status(400).json({ success: false, error: '没有有效的菜名' });
    }

    const results = [];
    const data = readData();
    let maxId = data.recipes.length > 0 
      ? Math.max(...data.recipes.map(r => r.id)) 
      : 0;

    for (const dishName of validNames) {
      try {
        console.log(`正在生成: ${dishName}`);
        const recipe = await generateRecipeWithAI(dishName);
        
        maxId++;
        const newRecipe = {
          ...recipe,
          id: maxId
        };
        
        data.recipes.push(newRecipe);
        
        results.push({
          name: dishName,
          success: true,
          data: newRecipe
        });
        
      } catch (error) {
        console.error(`生成失败: ${dishName}`, error);
        results.push({
          name: dishName,
          success: false,
          error: error.message
        });
      }
    }

    // 保存所有数据
    writeData(data);

    res.json({ 
      success: true, 
      results,
      total: validNames.length
    });
  } catch (error) {
    console.error('批量导入失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`数据保存在 ${DATA_FILE}`);
});
