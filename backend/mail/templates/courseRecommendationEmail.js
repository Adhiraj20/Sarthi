module.exports = ({ name, weakAreas, courses }) => {
  return `
    <div style="font-family: Arial; padding:20px;">
      <h2>Hi ${name} 👋</h2>

      <p>We analyzed your resume and found areas to improve:</p>

      <h3>⚠️ Weak Areas:</h3>
      <ul>
        ${weakAreas.map(w => `<li>${w}</li>`).join("")}
      </ul>

      <h3>🎯 Recommended Courses:</h3>
      <ul>
        ${courses.map(c => `
          <li>
            <b>${c.courseName}</b><br/>
            <a href="${c.link}">View Course</a>
          </li>
        `).join("")}
      </ul>

      <p>Improve these skills and you're on track 🚀</p>

      <p>— Team Sarthi</p>
    </div>
  `;
};