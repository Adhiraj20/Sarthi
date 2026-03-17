const axios = require("axios");

exports.getTechNews = async (req, res) => {
  try {

    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?category=technology&country=us&apiKey=${process.env.NEWS_API_KEY}`
    );

    return res.json({
      success: true,
      articles: response.data.articles
    });

  } catch (err) {

    console.error("NEWS ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};