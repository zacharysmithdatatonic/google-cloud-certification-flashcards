const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "..", "public");

const REQUIRED_KEYS = [
  "question",
  "options",
  "answer",
  "explanation",
  "questionImages",
  "optionImages",
];

const errors = [];

const optionLabel = (index) =>
  String.fromCharCode("A".charCodeAt(0) + index);

const validateEntry = (entry, index, fileName) => {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    errors.push(`${fileName}[${index}] must be an object.`);
    return;
  }

  for (const key of REQUIRED_KEYS) {
    if (!(key in entry)) {
      errors.push(`${fileName}[${index}] missing key "${key}".`);
    }
  }

  const questionText = typeof entry.question === "string" ? entry.question : "";
  const hasQuestionText = questionText.trim().length > 0;
  const hasQuestionImages =
    Array.isArray(entry.questionImages) && entry.questionImages.length > 0;
  if (!hasQuestionText && !hasQuestionImages) {
    errors.push(
      `${fileName}[${index}].question must be set when questionImages is empty.`
    );
  }

  if (!Array.isArray(entry.options) || entry.options.length === 0) {
    errors.push(`${fileName}[${index}].options must be a non-empty array.`);
  } else if (!entry.options.every((option) => typeof option === "string")) {
    errors.push(`${fileName}[${index}].options must be strings.`);
  }

  if (!Array.isArray(entry.answer) || entry.answer.length === 0) {
    errors.push(`${fileName}[${index}].answer must be a non-empty array.`);
  } else if (!entry.answer.every((value) => typeof value === "string")) {
    errors.push(`${fileName}[${index}].answer must be strings.`);
  }

  if (typeof entry.explanation !== "string") {
    errors.push(`${fileName}[${index}].explanation must be a string.`);
  }

  if (!Array.isArray(entry.questionImages)) {
    errors.push(`${fileName}[${index}].questionImages must be an array.`);
  }

  if (!Array.isArray(entry.optionImages)) {
    errors.push(`${fileName}[${index}].optionImages must be an array.`);
  }

  if (Array.isArray(entry.options) && Array.isArray(entry.optionImages)) {
    if (entry.optionImages.length !== entry.options.length) {
      errors.push(
        `${fileName}[${index}].optionImages length must match options length.`
      );
    }
  }

  if (Array.isArray(entry.options) && Array.isArray(entry.answer)) {
    const maxIndex = entry.options.length - 1;
    const validLabels = new Set(
      Array.from({ length: entry.options.length }, (_, idx) => optionLabel(idx))
    );
    entry.answer.forEach((value) => {
      if (!validLabels.has(value)) {
        errors.push(
          `${fileName}[${index}].answer contains invalid value "${value}".`
        );
      }
    });
    if (maxIndex < 0) {
      errors.push(`${fileName}[${index}] has no options to validate answers.`);
    }
  }
};

const jsonFiles = fs
  .readdirSync(PUBLIC_DIR)
  .filter((file) => file.endsWith(".json"));

jsonFiles.forEach((fileName) => {
  const filePath = path.join(PUBLIC_DIR, fileName);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${fileName} could not be parsed as JSON.`);
    return;
  }

  if (!Array.isArray(data)) {
    errors.push(`${fileName} must contain a JSON array.`);
    return;
  }

  data.forEach((entry, index) => validateEntry(entry, index, fileName));
});

if (errors.length > 0) {
  console.error("Flashcard schema validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Flashcard schema validation passed.");
