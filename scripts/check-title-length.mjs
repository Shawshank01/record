import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const contentDirectory = join(process.cwd(), "src", "content", "blog");
const titleSuffix = " · Michifumi's Blog";
const recommendedTitleLimit = 70;
const recommendedDescMin = 25;
const recommendedDescMax = 160;

const files = (await readdir(contentDirectory))
    .filter((file) => file.endsWith(".md"))
    .sort();

let warningCount = 0;

for (const file of files) {
    const filePath = join(contentDirectory, file);
    const source = await readFile(filePath, "utf8");
    const titleMatch = source.match(/^title:\s*["'](.+)["']\s*$/m);

    if (!titleMatch) {
        continue;
    }

    const title = titleMatch[1];
    const renderedTitle = `${title}${titleSuffix}`;

    if (renderedTitle.length > recommendedTitleLimit) {
        warningCount += 1;
        console.warn(
            `Warning: ${file} renders a ${renderedTitle.length}-character title (recommended maximum: ${recommendedTitleLimit}).`,
        );
    }

    const descMatch = source.match(/^description:\s*["'](.+)["']\s*$/m);
    if (descMatch) {
        const desc = descMatch[1];
        if (desc.length < recommendedDescMin || desc.length > recommendedDescMax) {
            warningCount += 1;
            console.warn(
                `Warning: ${file} description length is ${desc.length} chars (recommended: ${recommendedDescMin}-${recommendedDescMax} characters).`,
            );
        }
    }
}

if (warningCount === 0) {
    console.log(
        `SEO pre-check passed: all blog titles and descriptions meet recommended length limits.`,
    );
} else {
    console.warn(
        `SEO pre-check found ${warningCount} warning${warningCount === 1 ? "" : "s"}.`,
    );
}
