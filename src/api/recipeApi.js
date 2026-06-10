export const generateRecipeByAI = async (dishName) => {
  try {
    const response = await fetch('/api/generate-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dishName })
    });
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

export const batchGenerateRecipes = async (dishNames) => {
  try {
    const response = await fetch('/api/batch-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dishNames })
    });
    const result = await response.json();
    if (result.success) {
      return result.results;
    }
    throw new Error(result.error);
  } catch (error) {
    return dishNames.map(name => ({
      name,
      success: false,
      error: error.message
    }));
  }
};
