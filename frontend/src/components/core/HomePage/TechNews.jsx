import { useEffect, useState } from "react";
import axios from "axios";

export default function TechNews() {

  const [news, setNews] = useState([]);

  useEffect(() => {

    const fetchNews = async () => {

      const res = await axios.get(
        "http://localhost:5000/api/v1/news/tech"
      );

      setNews(res.data.articles);
    };

    fetchNews();

  }, []);

  return (
    <div className="p-6 text-white">

      <h2 className="text-2xl mb-4 font-bold">📰 Tech News</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {news.slice(0,6).map((item, i) => (

          <div key={i} className="bg-richblack-800 p-4 rounded">

            <img src={item.urlToImage} className="rounded mb-2" />

            <h3 className="font-semibold">{item.title}</h3>

            <a
              href={item.url}
              target="_blank"
              className="text-yellow-400"
            >
              Read More →
            </a>

          </div>

        ))}

      </div>

    </div>
  );
}