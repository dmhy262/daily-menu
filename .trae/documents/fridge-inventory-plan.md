# 冰箱库存功能模块 - 实现计划

## 概述

新增「冰箱库存」页面，用户可以维护家中现有食材及其数量。生成周菜谱时，系统会优先选择能消耗冰箱库存食材的菜谱。

***

## 步骤 1：新增导航标签和页面容器

**文件**: `public/index.html`

### 1.1 导航栏新增按钮

在导航栏 `nav` 中，在「购物清单」按钮后添加：

```html
<button class="nav-btn" data-page="fridge">🧊 冰箱库存</button>
```

### 1.2 新增页面容器

在 `page-shopping` 和 `page-recipes` 之间添加：

```html
<div class="page" id="page-fridge">
  <!-- 冰箱库存内容 -->
</div>
```

### 1.3 页面切换逻辑

在 `bindEvents()` 的导航切换 `if/else` 链中添加：

```javascript
} else if (page === 'fridge') {
  document.getElementById('page-fridge').classList.add('active');
  renderFridgePage();
}
```

***

## 步骤 2：数据结构设计

### 2.1 全局状态新增字段

```javascript
state.fridgeItems = [
  { id: 1234567890, name: "鸡胸肉", quantity: 500, unit: "g", addedAt: "2026-06-11T..." }
];
```

### 2.2 初始化默认值

```javascript
fridgeItems: [],
```

### 2.3 数据加载兼容

```javascript
state.fridgeItems = data.fridgeItems || [];
```

### 2.4 数据保存

`saveData()` 的请求体中添加：

```javascript
fridgeItems: state.fridgeItems
```

***

## 步骤 3：冰箱库存页面 UI 设计

### 3.1 页面布局

```
┌──────────────────────────────────────────────┐
│  🧊 冰箱库存                    [清空库存]    │
├──────────────────────────────────────────────┤
│  ┌─────────────────────┐ ┌────┐ ┌────┐ ┌──┐ │
│  │ 食材名称...          │ │数量│ │单位│ │+ │ │
│  └─────────────────────┘ └────┘ └────┘ └──┘ │
├──────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐│
│  │ 🥩 鸡胸肉    500g    2026-06-11   ✏️ 🗑️ ││
│  ├──────────────────────────────────────────┤│
│  │ 🥬 青菜      300g    2026-06-10   ✏️ 🗑️ ││
│  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

### 3.2 添加食材表单

- 食材名称输入框（必填）
- 数量输入框（数字，非必填）
- 单位选择器（g / kg / 个 / 颗 / 把 / 块 / 条 / 袋 / 瓶 / 其他）
- 添加按钮

### 3.3 食材列表

- 每行显示：食材名称、数量+单位、添加日期、编辑按钮、删除按钮
- 支持内联编辑（点击编辑后变为输入框）
- 空状态提示：「冰箱空空如也，快去添加食材吧！」

### 3.4 清空库存按钮

- 右上角「清空库存」按钮，点击后二次确认

***

## 步骤 4：冰箱库存页面渲染逻辑

### 4.1 `renderFridgePage()` 函数

```javascript
function renderFridgePage() {
  const page = document.getElementById('page-fridge');
  const items = state.fridgeItems;
  
  page.innerHTML = `
    <div class="fridge-header">
      <h2>🧊 冰箱库存</h2>
      ${items.length > 0 ? '<button class="clear-fridge-btn" onclick="clearFridge()">清空库存</button>' : ''}
    </div>
    <div class="fridge-add-form">
      <input type="text" id="fridge-name" placeholder="食材名称" class="form-input" style="flex:2;">
      <input type="number" id="fridge-qty" placeholder="数量" class="form-input" style="flex:1;" min="1">
      <select id="fridge-unit" class="form-input" style="flex:0.8;">
        <option value="g">g</option>
        <option value="kg">kg</option>
        <option value="个">个</option>
        ...
      </select>
      <button class="add-fridge-btn" onclick="addFridgeItem()">+</button>
    </div>
    <div class="fridge-list">
      ${items.length === 0 ? '<div class="fridge-empty">冰箱空空如也，快去添加食材吧！</div>' : items.map(item => `
        <div class="fridge-item">
          <span class="fridge-item-name">${getFridgeEmoji(item.name)} ${item.name}</span>
          <span class="fridge-item-qty">${item.quantity}${item.unit}</span>
          <span class="fridge-item-date">${new Date(item.addedAt).toLocaleDateString()}</span>
          <button onclick="editFridgeItem(${item.id})">✏️</button>
          <button onclick="deleteFridgeItem(${item.id})">🗑️</button>
        </div>
      `).join('')}
    </div>
  `;
}
```

### 4.2 辅助函数

- `addFridgeItem()` — 读取表单值，创建新食材对象，push 到 state.fridgeItems，saveData()，重新渲染
- `editFridgeItem(id)` — 将当前行切换为编辑模式（输入框替换显示文本）
- `saveFridgeEdit(id)` — 保存编辑后的值
- `deleteFridgeItem(id)` — 从数组中移除，saveData()，重新渲染
- `clearFridge()` — 二次确认后清空数组
- `getFridgeEmoji(name)` — 根据食材名称返回对应 emoji（肉🥩、菜🥬、蛋🥚、鱼🐟 等）

***

## 步骤 5：菜谱生成逻辑改造（优先消耗冰箱食材）

### 5.1 食材匹配函数

```javascript
function getFridgeMatchScore(recipe) {
  if (!state.fridgeItems || state.fridgeItems.length === 0) return 0;
  
  let score = 0;
  const fridgeNames = state.fridgeItems.map(f => f.name);
  
  recipe.ingredients.forEach(ing => {
    // 提取食材名称（去掉数量和单位）
    const ingName = ing.replace(/[\d.]+/g, '').replace(/[gG克千克个颗把块条袋瓶勺汤匙茶匙适量少许]/g, '').trim();
    // 检查冰箱中是否有匹配的食材
    fridgeNames.forEach(fName => {
      if (ingName.includes(fName) || fName.includes(ingName)) {
        score += 1;
      }
    });
  });
  
  return score;
}
```

### 5.2 改造 `getRandomRecipe()` 为加权随机

```javascript
function getWeightedRandomRecipe(list, type) {
  if (!list || list.length === 0) return null;
  
  const used = usedRecipeIdsByType[type] || [];
  let available = list.filter(r => r && r.id && !used.includes(r.id));
  
  if (available.length === 0) {
    usedRecipeIdsByType[type] = [];
    available = list.filter(r => r && r.id);
  }
  
  if (available.length === 0) return null;
  
  // 计算每个菜谱的权重：基础权重 1 + 冰箱匹配分 * 3
  const weighted = available.map(r => ({
    recipe: r,
    weight: 1 + getFridgeMatchScore(r) * 3
  }));
  
  // 加权随机选择
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const w of weighted) {
    random -= w.weight;
    if (random <= 0) {
      usedRecipeIdsByType[type].push(w.recipe.id);
      return w.recipe;
    }
  }
  
  // fallback
  const selected = available[0];
  usedRecipeIdsByType[type].push(selected.id);
  return selected;
}
```

### 5.3 替换 `regenerateWeekMenu()` 中的调用

将 `getRandomRecipe(recipesByType[cat], cat)` 替换为 `getWeightedRandomRecipe(recipesByType[cat], cat)`。

***

## 步骤 6：CSS 样式

### 6.1 冰箱库存页面样式

```css
.fridge-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.fridge-header h2 { font-size: 20px; font-weight: 600; color: var(--text-primary); }
.clear-fridge-btn {
  padding: 8px 16px; background: rgba(231, 133, 133, 0.1);
  border: 1px solid var(--accent-red); color: var(--accent-red);
  border-radius: 10px; font-size: 13px; cursor: pointer; transition: all 0.2s;
}
.clear-fridge-btn:hover { background: var(--accent-red); color: white; }

.fridge-add-form {
  display: flex; gap: 10px; margin-bottom: 20px; align-items: center;
}
.add-fridge-btn {
  width: 44px; height: 44px; border: none;
  background: linear-gradient(135deg, var(--accent-green) 0%, #A8D8A7 100%);
  color: white; border-radius: 12px; font-size: 22px; cursor: pointer;
  transition: all 0.2s; flex-shrink: 0;
}
.add-fridge-btn:hover { transform: scale(1.05); }

.fridge-list { display: flex; flex-direction: column; gap: 8px; }
.fridge-empty {
  text-align: center; padding: 40px; color: var(--text-light);
  font-size: 15px;
}
.fridge-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px; background: var(--white);
  border-radius: 14px; box-shadow: var(--shadow-light);
  transition: all 0.2s;
}
.fridge-item:hover { transform: translateX(4px); }
.fridge-item-name { flex: 2; font-weight: 500; color: var(--text-primary); }
.fridge-item-qty {
  flex: 1; color: var(--accent-orange); font-weight: 600; text-align: center;
}
.fridge-item-date { flex: 1; color: var(--text-light); font-size: 13px; text-align: center; }
.fridge-item button {
  background: none; border: none; cursor: pointer; font-size: 16px;
  padding: 4px 8px; border-radius: 8px; transition: all 0.2s;
}
.fridge-item button:hover { background: var(--warm-beige); }
```

### 6.2 周菜谱中冰箱匹配标识

在 `renderRecipeTag()` 中，如果菜谱使用了冰箱食材，在标签上添加一个小冰箱图标 🧊：

```javascript
const fridgeScore = getFridgeMatchScore(recipe);
const fridgeBadge = fridgeScore > 0 ? `<span title="消耗冰箱食材" style="font-size:12px;">🧊</span>` : '';
```

***

## 步骤 7：周菜谱详情中显示冰箱匹配信息

在 `viewRecipeDetail()` 渲染的详情弹窗中，添加冰箱食材匹配提示：

```javascript
const fridgeScore = getFridgeMatchScore(recipe);
const fridgeMatchHtml = fridgeScore > 0 ? `
  <div style="margin-top:16px; padding:12px; background:rgba(136,198,135,0.1); border-radius:12px; font-size:13px; color:#5C9B5B;">
    🧊 此菜品可消耗冰箱中 ${fridgeScore} 种食材
  </div>
` : '';
```

***

## 修改文件清单

| 文件                  | 修改内容                                                                                                                                                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `public/index.html` | 新增导航按钮、页面容器、切换逻辑、CSS 样式、`renderFridgePage()`、`addFridgeItem()`、`editFridgeItem()`、`deleteFridgeItem()`、`clearFridge()`、`getFridgeEmoji()`、`getFridgeMatchScore()`、`getWeightedRandomRecipe()`、改造 `regenerateWeekMenu()`、改造 `renderRecipeTag()`、改造 `viewRecipeDetail()`、更新 `state` 初始化、`loadAllData()`、`saveData()` |
| `server.js`         | 无需修改（数据通过现有 `POST /api/data` 接口自动持久化）                                                                                                                                                                                                                                                                              |

***

## 实施顺序

1. 先添加导航按钮和页面容器（步骤 1）
2. 更新 state 和 saveData/loadData（步骤 2）
3. 实现 `renderFridgePage()` 和增删改函数（步骤 3-4）
4. 添加 CSS 样式（步骤 6）
5. 实现 `getFridgeMatchScore()` 和 `getWeightedRandomRecipe()`（步骤 5）
6. 改造 `regenerateWeekMenu()` 使用加权随机（步骤 5）
7. 添加冰箱匹配标识到周菜谱标签和详情（步骤 6.2 + 步骤 7）
8. 测试完整流程

