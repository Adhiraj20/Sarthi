exports.extractJSON = (text) => {
  try {
    text = text.replace(/```json|```/g, "");

    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");

    if (start === -1 || end === -1) {
      throw new Error("No JSON found");
    }

    const jsonString = text.substring(start, end + 1);

    return JSON.parse(jsonString);

  } catch (error) {
    console.error("JSON Extract Error:", text);
    throw new Error("Failed to parse AI response");
  }
};