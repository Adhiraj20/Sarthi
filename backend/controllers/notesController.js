const { exec } = require("child_process");
const fs = require("fs");
const axios = require("axios");
const path = require("path");

exports.generateNotes = async (req, res) => {
  try {
    const { videoUrl } = req.body;

const uniqueId = Date.now();

const videoPath = path.join(__dirname, `../temp/video-${uniqueId}.mp4`);
const audioPath = path.join(__dirname, `../temp/audio-${uniqueId}.mp3`);

    // 🟡 1. Download video
    const writer = fs.createWriteStream(videoPath);

    const response = await axios({
      url: videoUrl,
      method: "GET",
      responseType: "stream",
    });

    response.data.pipe(writer);

    await new Promise((resolve) => writer.on("finish", resolve));

    console.log("Video downloaded");

    // 🟡 2. Convert video → audio using ffmpeg
    console.log("Starting audio extraction...")
    await new Promise((resolve, reject) => {
      exec(
        `ffmpeg -i "${videoPath}" -q:a 0 -map a "${audioPath}"`,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log("Audio extracted");

    // 🟡 3. Run Whisper (Python)
    console.log("Starting transcription...")
    const transcript = await new Promise((resolve, reject) => {
      exec(
        `python utils/transcribe.py "${audioPath}"`,
        (err, stdout) => {
          if (err) reject(err);
          else resolve(stdout);
        }
      );
    });



    // 🟡 4. Send transcript to OpenRouter
    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "user",content: `
Convert the following transcript into clean study notes.

Rules:
- Use headings
- Use bullet points
- Keep it simple and easy to understand
- Add short examples if possible
- No unnecessary text

Transcript:
${transcript}
`,
            },
          ],
        }),
      }
    );

    const data = await aiResponse.json();

    const notes = data.choices[0].message.content;

    return res.json({
      success: true,
      notes,
    });
  } catch (err) {
    console.error("NOTES ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};