const fs = require('fs/promises');
const path = require('path');
const https = require('https');
const cheerio = require('cheerio');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'test.html');
const OUTPUT_JSON = path.join(ROOT_DIR, 'public', 'pcd.json');
const IMAGE_DIR = path.join(ROOT_DIR, 'public', 'assets', 'pcd');

const htmlToText = html => {
    if (!html) return '';

    const normalized = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<p[^>]*>/gi, '');
    const $ = cheerio.load(`<div>${normalized}</div>`);
    return $('div')
        .text()
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

const stripOptionPrefix = text => text.replace(/^[A-Z]\.\s*/, '').trim();

const fetchBuffer = url =>
    new Promise((resolve, reject) => {
        https
            .get(url, response => {
    if (response.statusCode !== 200) {
        reject(
            new Error(`Failed to fetch ${url} (${response.statusCode})`)
        );
        return;
    }

    const contentType = response.headers['content-type'] || '';
    const chunks = [];
    response.on('data', chunk => chunks.push(chunk));
    response.on('end', () =>
        resolve({
            buffer: Buffer.concat(chunks),
            contentType,
        })
    );
            })
            .on('error', reject);
    });

const extFromContentType = contentType => {
    if (contentType.includes('image/png')) return 'png';
    if (contentType.includes('image/jpeg')) return 'jpg';
    if (contentType.includes('image/svg+xml')) return 'svg';
    if (contentType.includes('image/webp')) return 'webp';
    return 'img';
};

const ensureDir = async dirPath => {
    await fs.mkdir(dirPath, { recursive: true });
};

const extractAnswersFromSection = (section, options, $) => {
    const answers = [];
    section
        .find('[role="radio"][aria-checked="true"], [role="checkbox"][aria-checked="true"]')
        .each((_, node) => {
            const label = $(node).closest('label');
            const labelText =
    label.find('span.aDTYNe').first().text().trim() ||
    $(node).attr('aria-label') ||
    '';
            const match = labelText.match(/^([A-Z])\./);
            if (match) {
    answers.push(match[1]);
    return;
            }

            const normalized = stripOptionPrefix(labelText);
            const index = options.findIndex(
    option => stripOptionPrefix(option) === normalized
            );
            if (index >= 0) {
    answers.push(String.fromCharCode(65 + index));
            }
        });

    return answers;
};

const downloadImages = async (imageUrls, prefix, cache) => {
    const results = [];

    for (let i = 0; i < imageUrls.length; i += 1) {
        const url = imageUrls[i];
        if (!url) {
            results.push(null);
            continue;
        }

        if (cache.has(url)) {
            results.push(cache.get(url));
            continue;
        }

        const { buffer, contentType } = await fetchBuffer(url);
        const extension = extFromContentType(contentType);
        const fileName = `${prefix}-${i + 1}.${extension}`;
        const outputPath = path.join(IMAGE_DIR, fileName);
        await fs.writeFile(outputPath, buffer);
        const publicPath = `/assets/pcd/${fileName}`;
        cache.set(url, publicPath);
        results.push(publicPath);
    }

    return results;
};

const run = async () => {
    await ensureDir(IMAGE_DIR);
    const html = await fs.readFile(HTML_PATH, 'utf8');
    const $ = cheerio.load(html);

    const questionBlocks = $('div.OxAavc')
        .filter((_, element) => {
            const block = $(element);
            const hasPrompt = block.find('.cTDvob.D1wxyf.RjsPE span.M7eMe').length > 0;
            const hasOptions = block.find('span.aDTYNe').length > 0;
            return hasPrompt && hasOptions;
        })
        .toArray();

    const imageCache = new Map();
    const questions = [];

    for (let i = 0; i < questionBlocks.length; i += 1) {
        const block = $(questionBlocks[i]);
        const promptHtml = block
            .find('.cTDvob.D1wxyf.RjsPE span.M7eMe')
            .first()
            .html();
        const questionText = htmlToText(promptHtml);

        const questionImageUrls = block
            .find('div.gCouxf img')
            .map((_, img) => $(img).attr('src'))
            .get()
            .filter(Boolean);

        const optionsContainer =
            block.find('[role="radiogroup"]').first().length > 0
    ? block.find('[role="radiogroup"]').first()
    : block.find('[jsname="JNdkSc"]').first();

        const optionNodes = optionsContainer.find('span.aDTYNe');
        const options = optionNodes
            .map((_, option) => stripOptionPrefix($(option).text()))
            .get();

        if (options.length === 0) {
            continue;
        }

        const optionImageUrls = optionNodes
            .map((_, optionNode) => {
    const label = $(optionNode).closest('label');
    return label.find('div.LAANW img').attr('src') || null;
            })
            .get();

        const correctAnswerSection = block
            .find('div.D42QGf')
            .filter((_, section) => {
    const heading = $(section).find('.fD9txe').text().trim();
    return heading.toLowerCase() === 'correct answer';
            })
            .first();

        const answers = correctAnswerSection.length
            ? extractAnswersFromSection(correctAnswerSection, options, $)
            : extractAnswersFromSection(optionsContainer, options, $);

        const feedback = block.find('div.fLYe2b.g9d02d .sIQxvc').first().html();
        const explanation = htmlToText(feedback);

        const questionImages = await downloadImages(
            questionImageUrls,
            `q-${i + 1}-question`,
            imageCache
        );
        const optionImages = await downloadImages(
            optionImageUrls,
            `q-${i + 1}-option`,
            imageCache
        );

        const normalizedOptionImages = optionImages.length
            ? optionImages
            : Array(options.length).fill(null);

        questions.push({
            question: questionText,
            options,
            answer: answers,
            explanation,
            questionImages: questionImages.filter(Boolean),
            optionImages: normalizedOptionImages,
        });
    }

    await fs.writeFile(OUTPUT_JSON, JSON.stringify(questions, null, 2));
    console.log(`Wrote ${questions.length} questions to ${OUTPUT_JSON}`);
};

run().catch(error => {
    console.error('Failed to extract PCD questions:', error);
    process.exit(1);
});
