---
title: "Clinging to Life on an Obsolete Intel Mac"
description: "Dealing with hardware obsolescence and Homebrew tier 3 software hurdles on an Intel MacBook in late 2026."
pubDate: 2026-08-30
tags:
  - MacBook
  - Homebrew
  - Node.js
---

On 13 August 2026, Apple listed my old Intel MacBook as an obsolete product. According to the [official description](https://support.apple.com/en-ie/102772):

> Products are considered obsolete when Apple stopped distributing them for sale more than 7 years ago.
>
> ...
>
> Apple discontinues all hardware service for obsolete products, and service providers cannot order parts for obsolete products.
>
> ...

That means that, except for the battery, I cannot get any repairs from official support. I would only be able to try my luck at a third-party repair shop if this old fellow breaks again.

Over the years, I've spilt milk on it and had to get the motherboard repaired. I dropped it at Connolly Station, thought it was definitely broken, and I literally held my head in my hands on the bench for several minutes. But this old chap has pulled through time and time again. Thanks to its 32 GB RAM, I can at least dip my toes into some small-size LLMs on it. While the lack of Metal framework support, which is only available on the M series of Macs, is really a pain in the ass, considering the recent price of RAM, I need it to keep chugging along for a couple more years.

The problem is, it's not just the lack of hardware repairs, the fading software support is coming back to bite me in the ass too. I even started seeing this issue when I updated using Homebrew:

```text
Error: node: no bottle available!
If you're feeling brave, you can try to install from source with:
  brew install --build-from-source node
This is a Tier 3 configuration:
  https://docs.brew.sh/Support-Tiers#tier-3
```

This means they are withdrawing support for the pre-built bottles for my old fellow. Although I could download the source code and compile it myself, that would mean more work. And the last thing I want is any hassle. Luckily, I found a workaround. I replaced the current one with node@24 LTS.

Replacing it is quite simple:

1. Install Node.js 24 LTS:

   ```bash
   brew install node@24
   ```

2. Uninstall the unversioned formula:

   ```bash
   brew uninstall node
   ```

3. Link `node@24` and overwrite any remaining npm files:

   ```bash
   brew link --overwrite node@24
   ```

4. Verify the active versions:

   ```bash
   node -v
   npm -v
   ```

According to [Homebrew](https://formulae.brew.sh/formula/node@24), this allows me to cling to life until 30 April 2027. I hope I can afford a new Mac before that time comes, otherwise, this kind of issue will become more and more common in the foreseeable future.

> [!TIP]
> npm does not age out unused-but-valid packages. The [docs](https://docs.npmjs.com/cli/v12/commands/npm-cache) are explicit: the cache grows as you install new packages, npm will not prune it on its own.

As a Node.js developer, I have found that running this command from time to time can reclaim a noticeable amount of disk space:

```bash
npm cache verify
```

Some might be tempted to use this to free up space:  
*npm cache clean --force*

But be careful with it, not only is it unnecessary, it could also waste bandwidth and slow down future installs.
