import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const contentDirectory = join(process.cwd(), "src", "content", "blog");
const titleSuffix = " · Michifumi's Blog";
const recommendedLimit = 70;

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

    if (renderedTitle.length > recommendedLimit) {
        warningCount += 1;
        console.warn(
            `Warning: ${file} renders a ${renderedTitle.length}-character title (recommended maximum: ${recommendedLimit}).`,
        );
    }

    const descMatch = source.match(/^description:\s*["'](.+)["']\s*$/m);
    if (descMatch) {
        const desc = descMatch[1];
        if (desc.length < 25 || desc.length > 160) {
            warningCount += 1;
            console.warn(
                `Warning: ${file} description length is ${desc.length} chars (recommended: 25-160 characters).`,
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
        `Title check found ${warningCount} title${warningCount === 1 ? "" : "s"} above the recommended limit.`,
    );
}
